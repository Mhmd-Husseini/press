import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Author update schema
const authorUpdateSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  bioAr: z.string().optional(),
  avatar: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  socialLinks: z.record(z.string()).optional(),
  isActive: z.boolean().optional()
});

// GET - Fetch single author
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const author = await prisma.author.findUnique({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        posts: {
          select: {
            id: true,
            status: true,
            translations: {
              select: {
                title: true,
                locale: true
              }
            },
            publishedAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(author);
  } catch (error) {
    console.error('Error fetching author:', error);
    return NextResponse.json(
      { error: 'Failed to fetch author' },
      { status: 500 }
    );
  }
}

// PUT - Update author
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = authorUpdateSchema.parse(body);

    // Check if author exists
    const existingAuthor = await prisma.author.findUnique({
      where: {
        id: params.id,
        deletedAt: null
      }
    });

    if (!existingAuthor) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    // Check if another author has the same English name
    const duplicateAuthor = await prisma.author.findFirst({
      where: {
        nameEn: validatedData.nameEn,
        id: { not: params.id },
        deletedAt: null
      }
    });

    if (duplicateAuthor) {
      return NextResponse.json(
        { error: 'Author with this English name already exists' },
        { status: 400 }
      );
    }

    const updatedAuthor = await prisma.author.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    return NextResponse.json(updatedAuthor);
  } catch (error) {
    console.error('Error updating author:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update author' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete author
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if author exists
    const existingAuthor = await prisma.author.findUnique({
      where: {
        id: params.id,
        deletedAt: null
      },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!existingAuthor) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    // Check if author has posts
    if (existingAuthor._count.posts > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete author with existing posts. Please reassign posts first.',
          postsCount: existingAuthor._count.posts
        },
        { status: 400 }
      );
    }

    // Soft delete the author
    await prisma.author.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json(
      { message: 'Author deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting author:', error);
    return NextResponse.json(
      { error: 'Failed to delete author' },
      { status: 500 }
    );
  }
} 