import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId, read } = request.nextUrl.searchParams;
    
    let query = prisma.notification.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (userId) {
      query = query.where({ userId: parseInt(userId as string) });
    }

    if (read) {
      query = query.where({ read: read === 'true' });
    }

    const notifications = await query;
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message, type, data } = await request.json();
    
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'info',
        data: data || null,
        userId: parseInt(userId),
        read: false
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, read } = await request.json();
    
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        read: read === 'true'
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}