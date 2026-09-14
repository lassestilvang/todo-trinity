import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { smartPriority } from '@/lib/ai/smart-priority'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be signed in to access AI features' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Analyze and get recommendations
    const result = await smartPriority.analyzeAndRecommend(userId)

    // Get task details for insights
    const tasks = await prisma.task.findMany({ where: { userId } })

    const insights = result.recommendations.map(rec => ({
      taskId: rec.taskId,
      title: tasks.find(t => t.id === rec.taskId)?.title || 'Unknown',
      currentPriority: rec.currentPriority,
      suggestedPriority: rec.suggestedPriority,
      confidence: rec.confidence,
      reasoning: rec.reason,
      alternatives: rec.alternativePriorities
    }))

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations,
      insights,
      workload: {
        totalTasks: tasks.length,
        activeTasks: tasks.filter(t => t.status !== 'COMPLETED').length,
        overdueTasks: tasks.filter(t => {
          if (t.status === 'COMPLETED' || t.dueDate === null) return false
          return new Date(t.dueDate) < new Date()
        }).length
      },
      productivityPatterns: {
        peakHours: extractPeakHours(result),
        bestDays: extractBestDays(result)
      }
    })
  } catch (error) {
    console.error('Error fetching AI priority insights:', error)
    return NextResponse.json(
      { error: 'Failed to analyze priorities', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function extractPeakHours(result: any): number[] {
  const patterns = result.productivityPatterns
  if (!patterns || patterns.length === 0) return []
  return patterns
    .filter((p: any) => p.taskCount >= 3)
    .sort((a: any, b: any) => b.avgCompletionRate - a.avgCompletionRate)
    .slice(0, 4)
    .map((p: any) => p.hour)
}

function extractBestDays(result: any): number[] {
  const patterns = result.productivityPatterns
  if (!patterns || patterns.length === 0) return []
  const dayStats: Map<number, { totalRate: number; count: number }> = new Map()

  for (const p of patterns) {
    const existing = dayStats.get(p.dayOfWeek)
    if (existing) {
      existing.totalRate += p.avgCompletionRate
      existing.count++
    } else {
      dayStats.set(p.dayOfWeek, { totalRate: p.avgCompletionRate, count: 1 })
    }
  }

  return Array.from(dayStats.entries())
    .filter(([, stats]) => stats.count >= 2)
    .sort((a: any, b: any) => (b[1].totalRate / b[1].count) - (a[1].totalRate / a[1].count))
    .map(([day]) => day)
}