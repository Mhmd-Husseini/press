import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const mediaItems = await prisma.media.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        deletedAt: null
      }
    });

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    );
  }
} 