import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import prisma from '@/lib/prisma';

const authService = new AuthService();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to update media
    const canUpdateMedia = await authService.hasPermission(request, 'update_media');
    if (!canUpdateMedia) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { title, altText, caption } = data;

    // Update media record
    const updatedMedia = await prisma.media.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(altText !== undefined && { altText }),
        ...(caption !== undefined && { caption }),
      },
    });

    return NextResponse.json(updatedMedia);
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to delete media
    const canDeleteMedia = await authService.hasPermission(request, 'delete_media');
    if (!canDeleteMedia) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete media record
    await prisma.media.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
