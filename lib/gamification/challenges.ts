import { prisma } from '@/lib/prisma'
import { type Challenge, type ChallengeParticipant, type ChallengeType } from '@/lib/types/gamification'

export interface JoinChallengeResult {
  success: boolean
  participant: ChallengeParticipant | null
  message: string
}

export interface ChallengeWithParticipants extends Challenge {
  participants: ChallengeParticipant[]
}

export class ChallengeEngine {
  /**
   * Get all active challenges that the user can join
   */
  static async getActiveChallenges(userId: string): Promise<ChallengeWithParticipants[]> {
    const now = new Date()
    const challenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { maxParticipants: null },
          {
            participants: {
              none: {
                user: { id: userId }
              }
            }
          },
          {
            participants: {
              some: {
                userId,
              }
            }
          }
        ]
      },
      include: {
        participants: {
          take: 50,
          orderBy: { score: 'desc' },
          select: {
            id: true,
            challengeId: true,
            userId: true,
            joinedAt: true,
            progress: true,
            score: true,
            completed: true,
            completedAt: true,
          }
        },
      },
    })

    const now2 = new Date()
    return challenges.map(c => ({
      ...c,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      participants: c.participants.map(p => ({
        ...p,
        joinedAt: p.joinedAt.toISOString(),
        completedAt: p.completedAt?.toISOString() || undefined,
      }))
    }))
  }

  /**
   * Join a challenge
   */
  static async joinChallenge(userId: string, challengeId: string): Promise<JoinChallengeResult> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: {
          where: { userId },
        },
      },
    })

    if (!challenge) {
      return {
        success: false,
        participant: null,
        message: 'Challenge not found',
      }
    }

    const now = new Date()
    if (challenge.startDate > now || challenge.endDate < now) {
      return {
        success: false,
        participant: null,
        message: 'Challenge is not currently active',
      }
    }

    if (challenge.participants && challenge.participants.length > 0) {
      return {
        success: false,
        participant: null,
        message: 'You have already joined this challenge',
      }
    }

    if (challenge.maxParticipants) {
      const participantCount = await prisma.challengeParticipant.count({
        where: { challengeId },
      })
      if (participantCount >= challenge.maxParticipants) {
        return {
          success: false,
          participant: null,
          message: 'Challenge is full',
        }
      }
    }

    const participant = await prisma.challengeParticipant.create({
      data: {
        challengeId,
        userId,
        progress: 0,
        score: 0,
        completed: false,
      },
    })

    return {
      success: true,
      participant: {
        id: participant.id,
        challengeId: participant.challengeId,
        userId: participant.userId,
        joinedAt: participant.joinedAt.toISOString(),
        progress: participant.progress,
        score: participant.score,
        completed: participant.completed,
        completedAt: participant.completedAt?.toISOString() || undefined,
      },
      message: 'Successfully joined challenge',
    }
  }

  /**
   * Update challenge participant progress
   */
  static async updateProgress(
    userId: string,
    challengeId: string,
    taskCompleted: boolean
  ): Promise<void> {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { participants: { where: { userId } } },
    })

    if (!challenge || !challenge.participants || challenge.participants.length === 0) {
      return
    }

    // Different challenge types award points differently
    if (taskCompleted) {
      const pointValue = this.calculatePointValue(challenge)
      await prisma.challengeParticipant.update({
        where: {
          challengeId_userId: {
            challengeId,
            userId,
          },
        },
        data: {
          score: { increment: pointValue },
          progress: { increment: 1 },
        },
      })
    }

    // Check if challenge is complete
    await this.checkChallengeCompletion(challengeId)
  }

  /**
   * Calculate points for a completed task within a challenge
   */
  private static calculatePointValue(challenge: Challenge): number {
    // Base points + bonus for challenge duration
    const durationDays = Math.ceil(
      (new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    const durationBonus = Math.max(0, Math.floor((30 - durationDays) / 2))
    return challenge.rewardPoints + durationBonus
  }

  /**
   * Check if participants have completed the challenge
   */
  private static async checkChallengeCompletion(challengeId: string): Promise<void> {
    const now = new Date()
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: true,
      },
    })

    if (!challenge) return

    // Challenge is complete if current time exceeds end date
    if (now >= new Date(challenge.endDate)) {
      for (const participant of challenge.participants) {
        if (!participant.completed) {
          await prisma.challengeParticipant.update({
            where: { id: participant.id },
            data: {
              completed: true,
              completedAt: now,
            },
          })
        }
      }
    }
  }

  /**
   * Get leaderboard for a specific challenge
   */
  static async getChallengeLeaderboard(
    challengeId: string
  ): Promise<ChallengeParticipant[]> {
    const participants = await prisma.challengeParticipant.findMany({
      where: { challengeId },
      orderBy: { score: 'desc' },
      take: 10,
    })

    return participants.map(p => ({
      id: p.id,
      challengeId: p.challengeId,
      userId: p.userId,
      joinedAt: p.joinedAt.toISOString(),
      progress: p.progress,
      score: p.score,
      completed: p.completed,
      completedAt: p.completedAt?.toISOString() || undefined,
    }))
  }

  /**
   * Get a user's progress in all challenges they've joined
   */
  static async getUserChallengeProgress(
    userId: string
  ): Promise<ChallengeWithParticipants[]> {
    const participations = await prisma.challengeParticipant.findMany({
      where: { userId },
      include: {
        challenge: {
          include: {
            participants: {
              orderBy: { score: 'desc' },
              select: {
                id: true,
                userId: true,
                score: true,
                progress: true,
              },
            },
          },
        },
      },
    })

    return participations.map(p => ({
      ...p.challenge,
      startDate: p.challenge.startDate.toISOString(),
      endDate: p.challenge.endDate.toISOString(),
      createdAt: p.challenge.createdAt.toISOString(),
      updatedAt: p.challenge.updatedAt.toISOString(),
      participants: p.challenge.participants.map(part => ({
        id: part.id,
        challengeId: p.challengeId,
        userId: part.userId,
        joinedAt: '',
        progress: part.progress,
        score: part.score,
        completed: false,
      })),
    }))
  }

  /**
   * Create a challenge template for team challenges
   */
  static getChallengeTemplates(): ChallengeTemplate[] {
    return [
      {
        name: 'Sprint Challenge',
        description: 'Complete 10 tasks in one week',
        type: 'TEAM',
        durationDays: 7,
        rewardPoints: 100,
        criteria: {
          type: 'task_completion',
          threshold: 10,
          timeframe: 'weekly',
        },
      },
      {
        name: 'Daily Dozen',
        description: 'Complete 12 tasks in 12 days',
        type: 'INDIVIDUAL',
        durationDays: 12,
        rewardPoints: 120,
        criteria: {
          type: 'task_completion',
          threshold: 12,
          timeframe: 'daily',
        },
      },
      {
        name: 'Workspace Warrior',
        description: 'Complete 50 tasks as a workspace team',
        type: 'WORKSPACE',
        durationDays: 14,
        rewardPoints: 250,
        criteria: {
          type: 'task_completion',
          threshold: 50,
          timeframe: 'all_time',
        },
      },
    ]
  }
}

export interface ChallengeTemplate {
  name: string
  description: string
  type: ChallengeType
  durationDays: number
  rewardPoints: number
  criteria: ChallengeCriteria
}

export interface ChallengeCriteria {
  type: string
  threshold: number
  timeframe: string
}
