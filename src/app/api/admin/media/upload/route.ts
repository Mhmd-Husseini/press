import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import prisma from '@/lib/prisma';
import { MediaType } from '@prisma/client';
import { uploadToS3 } from '@/lib/s3';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to upload media
    const canUploadMedia = await authService.hasPermission(request, 'manage_media');
    if (!canUploadMedia) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const postId = formData.get('postId') as string | null;
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    
    console.log(`Processing ${files.length} files. PostId: ${postId || 'none'}`);
    
    // Extract metadata for each file
    const metadata: Array<{ title: string; altText: string; caption: string; captionAr: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const title = formData.get(`metadata[${i}][title]`) as string || '';
      const altText = formData.get(`metadata[${i}][altText]`) as string || '';
      const caption = formData.get(`metadata[${i}][caption]`) as string || '';
      const captionAr = formData.get(`metadata[${i}][captionAr]`) as string || '';
      metadata.push({ title, altText, caption, captionAr });
    }
    
    // Process each file
    const mediaItems = await Promise.all(files.map(async (file: File, index: number) => {
      const fileName = file.name.replace(/\s+/g, '-').toLowerCase();
      const fileType = file.type;
      const fileSize = file.size;
      const fileMetadata = metadata[index] || { title: '', altText: '', caption: '' };
      
      // Determine media type based on file MIME type
      let mediaType: MediaType = MediaType.IMAGE;
      if (fileType.startsWith('video/')) {
        mediaType = MediaType.VIDEO;
      } else if (fileType.startsWith('audio/')) {
        mediaType = MediaType.AUDIO;
      } else if (fileType === 'application/pdf' || fileType.includes('document')) {
        mediaType = MediaType.DOCUMENT;
      }
      
      try {
        // Upload the file to AWS S3
        const s3Url = await uploadToS3(file, 'posts');
        
        // Create media record in database
        const media = await prisma.media.create({
          data: {
            url: s3Url,
            type: mediaType,
            title: fileMetadata.title || fileName,
            altText: fileMetadata.altText || fileName,
            caption: fileMetadata.caption || null,
            captionAr: fileMetadata.captionAr || null,
            size: fileSize,
            mimeType: fileType,
            // Only create PostMedia relationship if postId is provided
            ...(postId ? {
              posts: {
                create: {
                  postId: postId
                }
              }
            } : {})
          }
        });
        
        return media;
      } catch (error) {
        console.error(`Error uploading file ${fileName}:`, error);
        throw error;
      }
    }));
    
    // If there's a postId, update the post's featured image if it doesn't have one yet
    if (postId && mediaItems.length > 0) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { 
          media: {
            include: {
              media: true
            }
          }
        }
      });
      
      // If the post exists and has no media yet, update to include the first uploaded image as featured
      if (post && (!post.media || post.media.length === 0)) {
        console.log(`Updating post ${postId} with featured image ${mediaItems[0].id}`);
        
        // No need to update since the relation is already established, but 
        // we could update other post fields related to the image if needed
      }
    }
    
    return NextResponse.json(mediaItems, { status: 201 });
    
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
} 