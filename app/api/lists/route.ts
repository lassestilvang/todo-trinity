import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const lists = await prisma.list.findMany({
      include: {
        tasks: {
          include: {
            labels: true
          }
        },
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color, description } = await request.json();
    
    const list = await prisma.list.create({
      data: {
        name,
        color: color || '#6366f1',
        description,
        userId: 1 // Default to first user for now
      },
      include: {
        tasks: {
          include: {
            labels: true
          }
        },
        user: true
      }
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json(
      { error: 'Failed to create list' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, color, description } = await request.json();
    
    const list = await prisma.list.update({
      where: { id: parseInt(id) },
      data: {
        name,
        color,
        description
      },
      include: {
        tasks: {
          include: {
            labels: true
          }
        },
        user: true
      }
    });

    return NextResponse.json({ list });
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json(
      { error: 'Failed to update list' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await prisma.list.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { error: 'Failed to delete list' },
      { status: 500 }
    );
  }
}