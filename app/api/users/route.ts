import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { id } = request.nextUrl.searchParams;
    
    let query = prisma.user.findMany({
      include: {
        tasks: {
          include: {
            list: true,
            labels: true
          }
        },
        lists: true,
        labels: true,
        notifications: true
      }
    });

    if (id) {
      query = query.where({ id: parseInt(id as string) });
    }

    const users = await query;
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, email, avatar, preferences } = await request.json();
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        avatar,
        preferences: {
          update: preferences || {}
        }
      },
      include: {
        tasks: {
          include: {
            list: true,
            labels: true
          }
        },
        lists: true,
        labels: true,
        notifications: true
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}