import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Test endpoint to verify Author model and seed data
export async function GET(request: NextRequest) {
  try {
    // Check if we have any authors
    const authorsCount = await prisma.author.count();
    
    if (authorsCount === 0) {
      // Create some sample authors
      const sampleAuthors = [
        {
          nameEn: 'John Smith',
          nameAr: 'جون سميث',
          country: 'United States',
          bio: 'Experienced journalist with over 10 years in international news.',
          bioAr: 'صحفي ذو خبرة تزيد عن 10 سنوات في الأخبار الدولية.',
          email: 'john.smith@example.com',
          isActive: true
        },
        {
          nameEn: 'Sarah Johnson',
          nameAr: 'سارة جونسون',
          country: 'Canada',
          bio: 'Political correspondent specializing in Middle Eastern affairs.',
          bioAr: 'مراسلة سياسية متخصصة في الشؤون الشرق أوسطية.',
          email: 'sarah.johnson@example.com',
          isActive: true
        },
        {
          nameEn: 'Ahmed Hassan',
          nameAr: 'أحمد حسن',
          country: 'Egypt',
          bio: 'Sports journalist covering international football and regional sports.',
          bioAr: 'صحفي رياضي يغطي كرة القدم الدولية والرياضة الإقليمية.',
          email: 'ahmed.hassan@example.com',
          isActive: true
        }
      ];

      for (const authorData of sampleAuthors) {
        await prisma.author.create({
          data: authorData
        });
      }
    }

    // Get all authors
    const authors = await prisma.author.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      message: 'Author model is working!',
      totalAuthors: authors.length,
      authors
    });
  } catch (error) {
    console.error('Error testing authors:', error);
    return NextResponse.json(
      { error: 'Failed to test authors', details: error },
      { status: 500 }
    );
  }
} 