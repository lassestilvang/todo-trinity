import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { query: searchQuery } = request.nextUrl.searchParams;
    
    if (!searchQuery) {
      return NextResponse.json({ results: [] });
    }

    const results = await prisma.$transaction([
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: searchQuery as string, mode: 'insensitive' } },
            { description: { contains: searchQuery as string, mode: 'insensitive' } }
          ]
        },
        include: {
          list: true,
          labels: true,
          user: true
        }
      }),
      prisma.list.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery as string, mode: 'insensitive' } },
            { description: { contains: searchQuery as string, mode: 'insensitive' } }
          ]
        },
        include: {
          tasks: {
            include: {
              labels: true
            }
          },
          user: true
        }
      }),
      prisma.label.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery as string, mode: 'insensitive' } },
            { description: { contains: searchQuery as string, mode: 'insensitive' } }
          ]
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
      })
    ]);

    const [tasks, lists, labels] = results;

    return NextResponse.json({
      results: {
        tasks,
        lists,
        labels
      }
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}