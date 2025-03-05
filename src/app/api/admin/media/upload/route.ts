import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import prisma from '@/lib/prisma';
import { MediaType } from '@prisma/client';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to upload media
    const canUploadMedia = await authService.hasPermission(request, 'upload_media');
    if (!canUploadMedia) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // For this example, we'll simulate file upload
    // In a real implementation, you would use a file storage service like AWS S3, Cloudinary, etc.
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const postId = formData.get('postId') as string | null;
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    // Process each file
    const mediaItems = await Promise.all(files.map(async (file) => {
      // In a real implementation, you would upload the file to a storage service
      // and get back a URL. For this example, we'll create a fake URL.
      const fileName = file.name.replace(/\s+/g, '-').toLowerCase();
      const fileType = file.type;
      const fileSize = file.size;
      
      // Determine media type based on file MIME type
      let mediaType = MediaType.IMAGE;
      if (fileType.startsWith('video/')) {
        mediaType = MediaType.VIDEO;
      } else if (fileType.startsWith('audio/')) {
        mediaType = MediaType.AUDIO;
      } else if (fileType === 'application/pdf' || fileType.includes('document')) {
        mediaType = MediaType.DOCUMENT;
      }
      
      // Create a fake URL for demonstration purposes
      // In a real implementation, this would be the URL returned by your storage service
      const fakeUrl = `/uploads/${Date.now()}-${fileName}`;
      
      // Create media record in database
      const media = await prisma.media.create({
        data: {
          url: fakeUrl,
          type: mediaType,
          title: fileName,
          altText: fileName,
          size: fileSize,
          mimeType: fileType,
          postId: postId || undefined
        }
      });
      
      return media;
    }));
    
    return NextResponse.json(mediaItems, { status: 201 });
    
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
} 