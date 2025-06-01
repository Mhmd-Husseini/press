import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Author creation/update schema
const authorSchema = z.object({
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  bioAr: z.string().optional(),
  avatar: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  socialLinks: z.record(z.string()).optional(),
  isActive: z.boolean().optional().default(true)
});

// GET - Fetch all authors with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            { nameEn: { contains: search, mode: 'insensitive' as const } },
            { nameAr: { contains: search, mode: 'insensitive' as const } },
            { country: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {};

    // Get authors with post count
    const [authors, total] = await Promise.all([
      prisma.author.findMany({
        where: {
          deletedAt: null,
          ...searchConditions
        },
        include: {
          _count: {
            select: { posts: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.author.count({
        where: {
          deletedAt: null,
          ...searchConditions
        }
      })
    ]);

    return NextResponse.json({
      authors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 }
    );
  }
}

// POST - Create new author
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = authorSchema.parse(body);

    // Check if author with same English name already exists
    const existingAuthor = await prisma.author.findFirst({
      where: {
        nameEn: validatedData.nameEn,
        deletedAt: null
      }
    });

    if (existingAuthor) {
      return NextResponse.json(
        { error: 'Author with this English name already exists' },
        { status: 400 }
      );
    }

    const author = await prisma.author.create({
      data: validatedData,
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    console.error('Error creating author:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create author' },
      { status: 500 }
    );
  }
} 