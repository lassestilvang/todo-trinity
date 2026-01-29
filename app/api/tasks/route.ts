import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { listId, labelId, status, search, dateRange } = request.nextUrl.searchParams;
    
    let query = prisma.task.findMany({
      include: {
        list: true,
        labels: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (listId) {
      query = query.where({ listId: parseInt(listId as string) });
    }

    if (labelId) {
      query = query.where({
        labels: {
          some: { id: parseInt(labelId as string) }
        }
      });
    }

    if (status) {
      query = query.where({ status: status as string });
    }

    if (search) {
      query = query.where({
        OR: [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ]
      });
    }

    if (dateRange) {
      const [start, end] = (dateRange as string).split(',');
      query = query.where({
        OR: [
          {
            dueDate: {
              gte: new Date(start),
              lte: new Date(end)
            }
          },
          {
            createdAt: {
              gte: new Date(start),
              lte: new Date(end)
            }
          }
        ]
      });
    }

    const tasks = await query;
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, dueDate, priority, listId, labelIds = [] } = await request.json();
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        status: 'pending',
        listId: listId ? parseInt(listId) : null,
        labels: {
          connect: labelIds.map((id: number) => ({ id }))
        }
      },
      include: {
        list: true,
        labels: true,
        user: true
      }
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, title, description, dueDate, priority, status, listId, labelIds = [] } = await request.json();
    
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status,
        listId: listId ? parseInt(listId) : null,
        labels: {
          set: labelIds.map((id: number) => ({ id }))
        }
      },
      include: {
        list: true,
        labels: true,
        user: true
      }
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}