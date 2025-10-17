import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const authorId = resolvedParams.id;

    if (!authorId) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }

    // Fetch author data
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: {
        posts: {
          where: {
            status: 'PUBLISHED'
          },
          include: {
            translations: {
              orderBy: {
                locale: 'asc'
              }
            },
            category: {
              include: {
                translations: true
              }
            },
            media: {
              include: {
                media: true
              }
            }
          },
          orderBy: {
            publishedAt: 'desc'
          },
          take: 10 // Limit to recent posts
        }
      }
    });

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    // Calculate post count
    const totalPosts = await prisma.post.count({
      where: {
        postAuthorId: authorId,
        status: 'PUBLISHED'
      }
    });

    // Return author data with post count
    return NextResponse.json({
      ...author,
      totalPosts
    });

  } catch (error) {
    console.error('Error fetching author:', error);
    return NextResponse.json(
      { error: 'Failed to fetch author' },
      { status: 500 }
    );
  }
}
