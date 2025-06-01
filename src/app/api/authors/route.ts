import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch active authors (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Build search conditions
    const searchConditions = search
      ? {
          OR: [
            { nameEn: { contains: search, mode: 'insensitive' as const } },
            { nameAr: { contains: search, mode: 'insensitive' as const } },
            { country: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {};

    const authors = await prisma.author.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...searchConditions
      },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        country: true,
        bio: true,
        bioAr: true,
        avatar: true
      },
      orderBy: { nameEn: 'asc' }
    });

    return NextResponse.json(authors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 }
    );
  }
} 