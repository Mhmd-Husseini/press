import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PostStatus } from '@prisma/client';
import { uploadToS3 } from '@/lib/s3';
import { generatePostSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // For demo purposes, we're not requiring authentication
    // In a real app, you would authenticate the user here
    
    // Get the form data
    const formData = await request.formData();
    
    // Extract fields
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const summary = formData.get('summary') as string || '';
    const categoryId = formData.get('categoryId') as string;
    const imageFile = formData.get('image') as File | null;
    
    // Validate required fields
    if (!title || !content || !categoryId) {
      return NextResponse.json({ 
        error: 'Title, content, and category are required' 
      }, { status: 400 });
    }
    
    // Create a slug with title and date
    const slug = generatePostSlug(title, 'en');
    
    let imageUrl = null;
    
    // First, we need to create a default author for demo purposes
    // In a real app, you would get the author from the authenticated user
    const defaultUser = await prisma.user.findFirst();
    
    if (!defaultUser) {
      return NextResponse.json({ 
        error: 'No default user found in the system'
      }, { status: 500 });
    }

    // Get or create a default author
    let defaultAuthor = await prisma.author.findFirst({
      where: { nameEn: 'Guest Author' }
    });

    if (!defaultAuthor) {
      defaultAuthor = await prisma.author.create({
        data: {
          nameEn: 'Guest Author',
          nameAr: 'كاتب ضيف',
          isActive: true
        }
      });
    }
    
    // Create the post first without media
    const post = await prisma.post.create({
      data: {
        status: PostStatus.DRAFT,
        featured: false,
        categoryId,
        authorId: defaultUser.id,
        postAuthorId: defaultAuthor.id,
        translations: {
          create: {
            locale: 'en',
            title,
            content,
            summary,
            slug,
          }
        }
      },
      include: {
        translations: true,
        postAuthor: true
      }
    });
    
    // Now handle the image if provided
    if (imageFile) {
      try {
        // Upload the image to S3
        imageUrl = await uploadToS3(imageFile, 'posts');
        
        // Create a media record and associate it with the post
        const media = await prisma.media.create({
          data: {
            url: imageUrl,
            type: 'IMAGE',
            title: title,
            altText: title,
            size: imageFile.size,
            mimeType: imageFile.type,
            postId: post.id // Important! Associate with the created post
          }
        });
        
        // Return the post with media included
        const postWithMedia = await prisma.post.findUnique({
          where: { id: post.id },
          include: {
            translations: true,
            media: true,
          }
        });
        
        return NextResponse.json(postWithMedia, { status: 201 });
      } catch (error) {
        console.error('Error uploading image:', error);
        // Even if image upload fails, return the created post
        return NextResponse.json(post, { status: 201 });
      }
    }
    
    // If no image, return the post as is
    return NextResponse.json(post, { status: 201 });
    
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ 
      error: 'Failed to create post' 
    }, { status: 500 });
  }
} 