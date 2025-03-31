import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFromS3 } from '@/lib/s3';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // Get the media item to find the file URL
    const media = await prisma.media.findUnique({
      where: { id }
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' }, 
        { status: 404 }
      );
    }

    // Delete from database
    await prisma.media.delete({
      where: { id }
    });

    // Delete from S3 if the item exists
    try {
      await deleteFromS3(media.url);
    } catch (err) {
      console.error('Failed to delete file from S3:', err);
      // Continue even if S3 deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
} 