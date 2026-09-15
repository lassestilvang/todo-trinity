import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAvailableRewards, claimReward, getUserRewards, hasClaimedReward, getRewardCatalog, redeemReward } from '@/lib/gamification/rewards'

// GET /api/gamification/rewards - Get available rewards for user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const rewards = await getAvailableRewards(userId)
    const claimedRewards = await getUserRewards(userId)

    return NextResponse.json({
      rewards,
      claimedRewards: claimedRewards.map((cr) => ({
        id: cr.id,
        userId: cr.userId,
        rewardId: cr.rewardId,
        claimedAt: cr.claimedAt || null,
        isClaimed: cr.isClaimed,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}

// POST /api/gamification/rewards/claim - Claim a reward
export async function POST(request: Request) {
  try {
    const { userId, rewardId } = await request.json()

    if (!userId || !rewardId) {
      return NextResponse.json(
        { error: 'User ID and Reward ID are required' },
        { status: 400 }
      )
    }

    const result = await claimReward(userId, rewardId)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to claim reward' },
      { status: 500 }
    )
  }
}

// PUT /api/gamification/rewards/redeem - Redeem points for reward
export async function PUT(request: Request) {
  try {
    const { userId, rewardId } = await request.json()

    if (!userId || !rewardId) {
      return NextResponse.json(
        { error: 'User ID and Reward ID are required' },
        { status: 400 }
      )
    }

    const result = await redeemReward(userId, rewardId)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to redeem reward' },
      { status: 500 }
    )
  }
}

// GET /api/gamification/rewards/catalog - Get reward catalog
export async function GET_CATALOG(request: Request) {
  try {
    const catalog = await getRewardCatalog()
    return NextResponse.json({ catalog })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reward catalog' },
      { status: 500 }
    )
  }
}

// Override method for catalog
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'catalog') {
      const catalog = await getRewardCatalog()
      return NextResponse.json({ catalog })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}