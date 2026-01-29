import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const labels = await prisma.label.findMany({
      include: {
        tasks: {
          include: {
            list: true,
            user: true
          }
        },
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ labels });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, color, description } = await request.json();
    
    const label = await prisma.label.create({
      data: {
        name,
        color: color || '#10b981',
        description,
        userId: 1 // Default to first user for now
      },
      include: {
        tasks: {
          include: {
            list: true,
            user: true
          }
        },
        user: true
      }
    });

    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, color, description } = await request.json();
    
    const label = await prisma.label.update({
      where: { id: parseInt(id) },
      data: {
        name,
        color,
        description
      },
      include: {
        tasks: {
          include: {
            list: true,
            user: true
          }
        },
        user: true
      }
    });

    return NextResponse.json({ label });
  } catch (error) {
    console.error('Error updating label:', error);
    return NextResponse.json(
      { error: 'Failed to update label' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await prisma.label.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    );
  }
}