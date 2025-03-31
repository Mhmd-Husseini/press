import { NextResponse } from 'next/server';
import { MediaType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { uploadToS3 } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || file.name;
    const altText = formData.get('altText') as string || title;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload file to S3
    const url = await uploadToS3(file, 'media');

    // Determine media type based on mime type
    let mediaType: MediaType = MediaType.IMAGE;
    if (file.type.startsWith('video/')) {
      mediaType = MediaType.VIDEO;
    } else if (file.type.startsWith('audio/')) {
      mediaType = MediaType.AUDIO;
    } else if (file.type.includes('pdf') || file.type.includes('document')) {
      mediaType = MediaType.DOCUMENT;
    }

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        url,
        title,
        type: mediaType,
        altText,
        mimeType: file.type,
        size: file.size
      }
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 