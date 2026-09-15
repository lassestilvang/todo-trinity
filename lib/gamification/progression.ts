const extractPrereqs = (prereqs: any): string[] => {
  if (!Array.isArray(prereqs)) return []
  return prereqs.filter((p): p is string => typeof p === 'string')
}

import { prisma } from '@/lib/prisma'
import { type SkillTreeNode, type SkillTree } from '@/lib/types/gamification'

export interface UserPoints {
  id: string
  userId: string
  totalPoints: number
  level: number
  currentLevelXp: number
  levelXpRequired: number
  lastUpdated: string
}

export interface UserLevel {
  level: number
  xp: number
  xpToNextLevel: number
}

/**
 * Calculate the XP required for a given level
 */
const calculateXpRequired = (level: number): number => {
  // Exponential scaling: 100, 200, 400, 800, 1600...
  return Math.round(100 * Math.pow(1.5, level - 1))
}

/**
 * Get user's current points and level data
 */
export async function getUserLevel(userId: string): Promise<UserLevel> {
  const pointsData = await prisma.userPoints.findUnique({
    where: { userId },
    select: {
      totalPoints: true,
      level: true,
      currentLevelXp: true,
      levelXpRequired: true,
    },
  })

  if (!pointsData) {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
    }
  }

  const totalXp = pointsData.totalPoints || 0
  let currentLevel = pointsData.level || 1
  let xpInCurrentLevel = 0

  // Calculate XP accumulated in current level
  for (let i = 1; i < currentLevel; i++) {
    xpInCurrentLevel += calculateXpRequired(i)
  }

  // Calculate XP to next level
  const xpToNextLevel = calculateXpRequired(currentLevel + 1)

  // If total XP exceeds what's needed for current level, bump up
  let level = currentLevel
  while (totalXp >= xpInCurrentLevel + calculateXpRequired(level)) {
    xpInCurrentLevel += calculateXpRequired(level)
    level++
  }

  const xpLevelStart = calculateXpRequired(level)
  const xpInThisLevel = totalXp - xpLevelStart
  const xpToNextLevelFinal = calculateXpRequired(level + 1)

  return {
    level,
    xp: xpInThisLevel,
    xpToNextLevel: xpToNextLevelFinal,
  }
}

/**
 * Award points to user for an activity
 */
export async function awardPoints(
  userId: string,
  amount: number,
  type: 'task_completed' | 'achievement_unlocked' | 'challenge_won' | 'daily_streak' | 'bonus',
  referenceId?: string,
  description?: string
): Promise<UserPoints> {
  const now = new Date()

  // Try to get or create points record
  let pointsData = await prisma.userPoints.findUnique({
    where: { userId },
  })

  const totalAmount = amount

  if (!pointsData) {
    pointsData = await prisma.userPoints.create({
      data: {
        userId,
        totalPoints: totalAmount,
        level: 1,
        currentLevelXp: 0,
        levelXpRequired: calculateXpRequired(1),
        lastUpdated: now,
      },
    })
  } else {
    const newTotal = (pointsData.totalPoints || 0) + totalAmount
    const nextLevel = (pointsData.level || 1) + 1
    const xpForNextLevel = calculateXpRequired(nextLevel)

    await prisma.userPoints.update({
      where: { userId },
      data: {
        totalPoints: newTotal,
        level:
          newTotal >= xpForNextLevel ? nextLevel : (pointsData.level || 1),
        currentLevelXp:
          newTotal >= xpForNextLevel
            ? 0
            : (pointsData.currentLevelXp || 0) + totalAmount,
        levelXpRequired: xpForNextLevel,
        lastUpdated: now,
      },
    })

    return {
      id: pointsData.id,
      userId,
      totalPoints: newTotal,
      level: newTotal >= xpForNextLevel ? nextLevel : (pointsData.level || 1),
      currentLevelXp:
        newTotal >= xpForNextLevel
          ? 0
          : (pointsData.currentLevelXp || 0) + totalAmount,
      levelXpRequired: xpForNextLevel,
      lastUpdated: now.toISOString(),
    }
  }

  return {
    id: pointsData.id,
    userId,
    totalPoints: pointsData.totalPoints,
    level: pointsData.level,
    currentLevelXp: pointsData.currentLevelXp,
    levelXpRequired: pointsData.levelXpRequired,
    lastUpdated: pointsData.lastUpdated.toISOString(),
  }
}

/**
 * Update XP progress for a user after awarding points
 */
export async function updateXpProgress(userId: string): Promise<UserLevel> {
  const pointsData = await prisma.userPoints.findUnique({
    where: { userId },
  })

  if (!pointsData) {
    return { level: 1, xp: 0, xpToNextLevel: 100 }
  }

  const totalXp = pointsData.totalPoints || 0
  let currentLevel = pointsData.level || 1

  // Calculate XP accumulated in current level
  let xpInCurrentLevel = 0
  for (let i = 1; i < currentLevel; i++) {
    xpInCurrentLevel += calculateXpRequired(i)
  }

  // Find the level
  let level = currentLevel
  while (totalXp >= xpInCurrentLevel + calculateXpRequired(level)) {
    xpInCurrentLevel += calculateXpRequired(level)
    level++
  }

  const xpLevelStart = calculateXpRequired(level)
  const xpInThisLevel = totalXp - xpLevelStart
  const xpToNextLevel = calculateXpRequired(level + 1)

  // Update in database
  await prisma.userPoints.update({
    where: { userId },
    data: {
      level,
      currentLevelXp: xpInThisLevel,
      levelXpRequired: xpToNextLevel,
    },
  })

  return {
    level,
    xp: xpInThisLevel,
    xpToNextLevel,
  }
}

/**
 * Get user's skill tree
 */
export async function getSkillTree(userId: string): Promise<SkillTree | null> {
  const skillTree = await prisma.skillTree.findUnique({
    where: { userId },
    include: {
      nodes: {
        orderBy: { positionX: 'asc' },
      },
    },
  })

  if (!skillTree) {
    return null
  }

  return {
    id: skillTree.id,
    userId: skillTree.userId,
    name: skillTree.name,
    description: skillTree.description || undefined,
    createdAt: skillTree.createdAt.toISOString(),
    updatedAt: skillTree.updatedAt.toISOString(),
    nodes: skillTree.nodes.map(node => ({
      id: node.id,
      skillTreeId: node.skillTreeId,
      name: node.name,
      description: node.description || undefined,
      icon: node.icon,
      xpValue: node.xpValue,
      prerequisites: extractPrereqs(node.prerequisites),
      isUnlocked: node.isUnlocked,
      isCompleted: node.isCompleted,
      completedAt: node.completedAt?.toISOString() || undefined,
      positionX: node.positionX,
      positionY: node.positionY,
    })),
  }
}

/**
 * Unlock a skill tree node
 */
export async function unlockSkillNode(
  userId: string,
  nodeId: string
): Promise<{ node: SkillTreeNode; skillTree: SkillTree } | null> {
  // First find the node and check prerequisites
  const node = await prisma.skillTreeNode.findUnique({
    where: { id: nodeId },
    include: {
      skillTree: true,
    },
  })

  if (!node || node.isUnlocked) {
    return null
  }

  // Check prerequisites
  const prereqs = (node.prerequisites as string[]) || []
  if (prereqs.length > 0) {
    const prerequisitesMet = await prisma.skillTreeNode.findMany({
      where: {
        id: { in: prereqs },
        skillTree: { userId },
        isCompleted: true,
      },
    })

    if (prerequisitesMet.length !== prereqs.length) {
      return null // Prerequisites not met
    }
  }

  // Award XP for unlocking
  await awardPoints(userId, node.xpValue, 'bonus')

  // Mark node as unlocked
  await prisma.skillTreeNode.update({
    where: { id: nodeId },
    data: { isUnlocked: true },
  })

  // Check if we can mark it as completed (would require all prereqs to be completed first)
  // For now, just mark as unlocked

  const updatedSkillTree = await prisma.skillTree.findUnique({
    where: { userId },
    include: {
      nodes: true,
    },
  })

  if (!updatedSkillTree) {
    return null
  }

  const unlockedNode = updatedSkillTree.nodes.find(n => n.id === nodeId)

  if (!unlockedNode) {
    return null
  }

  return {
    node: {
      id: unlockedNode.id,
      skillTreeId: unlockedNode.skillTreeId,
      name: unlockedNode.name,
      description: unlockedNode.description || undefined,
      icon: unlockedNode.icon,
      xpValue: unlockedNode.xpValue,
      prerequisites: extractPrereqs(unlockedNode.prerequisites),
      isUnlocked: unlockedNode.isUnlocked,
      isCompleted: unlockedNode.isCompleted,
      completedAt: unlockedNode.completedAt?.toISOString() || undefined,
      positionX: unlockedNode.positionX,
      positionY: unlockedNode.positionY,
    },
    skillTree: {
      id: updatedSkillTree.id,
      userId: updatedSkillTree.userId,
      name: updatedSkillTree.name,
      description: updatedSkillTree.description || undefined,
      createdAt: updatedSkillTree.createdAt.toISOString(),
      updatedAt: updatedSkillTree.updatedAt.toISOString(),
      nodes: updatedSkillTree.nodes.map(n => ({
        id: n.id,
        skillTreeId: n.skillTreeId,
        name: n.name,
        description: n.description || undefined,
        icon: n.icon,
        xpValue: n.xpValue,
        prerequisites: extractPrereqs(n.prerequisites),
        isUnlocked: n.isUnlocked,
        isCompleted: n.isCompleted,
        completedAt: n.completedAt?.toISOString() || undefined,
        positionX: n.positionX,
        positionY: n.positionY,
      })),
    },
  }
}

/**
 * Mark a skill tree node as completed
 */
export async function completeSkillNode(
  userId: string,
  nodeId: string
): Promise<{ node: SkillTreeNode; skillTree: SkillTree } | null> {
  const node = await prisma.skillTreeNode.findUnique({
    where: { id: nodeId },
    include: {
      skillTree: true,
    },
  })

  if (!node) {
    return null
  }

  // Award XP for completion
  await awardPoints(userId, node.xpValue * 2, 'bonus') // Double XP for completion

  // Mark node as completed
  await prisma.skillTreeNode.update({
    where: { id: nodeId },
    data: { isCompleted: true, completedAt: new Date() },
  })

  const updatedSkillTree = await prisma.skillTree.findUnique({
    where: { userId },
    include: {
      nodes: true,
    },
  })

  if (!updatedSkillTree) {
    return null
  }

  const completedNode = updatedSkillTree.nodes.find(n => n.id === nodeId)

  if (!completedNode) {
    return null
  }

  return {
    node: {
      id: completedNode.id,
      skillTreeId: completedNode.skillTreeId,
      name: completedNode.name,
      description: completedNode.description || undefined,
      icon: completedNode.icon,
      xpValue: completedNode.xpValue,
      prerequisites: extractPrereqs(completedNode.prerequisites),
      isUnlocked: completedNode.isUnlocked,
      isCompleted: completedNode.isCompleted,
      completedAt: completedNode.completedAt?.toISOString() || undefined,
      positionX: completedNode.positionX,
      positionY: completedNode.positionY,
    },
    skillTree: {
      id: updatedSkillTree.id,
      userId: updatedSkillTree.userId,
      name: updatedSkillTree.name,
      description: updatedSkillTree.description || undefined,
      createdAt: updatedSkillTree.createdAt.toISOString(),
      updatedAt: updatedSkillTree.updatedAt.toISOString(),
      nodes: updatedSkillTree.nodes.map(n => ({
        id: n.id,
        skillTreeId: n.skillTreeId,
        name: n.name,
        description: n.description || undefined,
        icon: n.icon,
        xpValue: n.xpValue,
        prerequisites: extractPrereqs(n.prerequisites),
        isUnlocked: n.isUnlocked,
        isCompleted: n.isCompleted,
        completedAt: n.completedAt?.toISOString() || undefined,
        positionX: n.positionX,
        positionY: n.positionY,
      })),
    },
  }
}
