import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { format, subDays } from 'date-fns';

const authService = new AuthService();

// Helper function to convert BigInt values to numbers for JSON serialization
function serializeBigInt(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'bigint') {
    return Number(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeBigInt(item));
  }
  
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeBigInt(data[key]);
    }
    return result;
  }
  
  return data;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view dashboard
    const canViewDashboard = await authService.hasPermission(request, 'view_dashboard');
    if (!canViewDashboard) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user from request
    const user = await authService.getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    // Get dashboard statistics
    const stats = await getDashboardStats(user);
    
    // Serialize BigInt values before returning as JSON
    return NextResponse.json(serializeBigInt(stats));
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function getDashboardStats(user: any) {
  const prisma = (await import('@/lib/prisma')).default;
  
  // Get total posts count
  const totalPosts = await prisma.post.count();
  
  // Get published posts count
  const publishedPosts = await prisma.post.count({
    where: { status: 'PUBLISHED' }
  });
  
  // Get draft posts count
  const draftPosts = await prisma.post.count({
    where: { status: 'DRAFT' }
  });
  
  // Get scheduled posts count - commented out if SCHEDULED is not a valid status
  // const scheduledPosts = await prisma.post.count({
  //   where: { status: 'SCHEDULED' }
  // });
  const scheduledPosts = 0; // Default to 0 if not supported
  
  // Get posts waiting for approval count
  const pendingApprovals = await prisma.post.count({
    where: { status: 'WAITING_APPROVAL' }
  });
  
  // Get total users count
  const totalUsers = await prisma.user.count();
  
  // Get active users (users that logged in within the last 30 days)
  const activeUsers = await prisma.user.count({
    where: {
      lastLogin: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    }
  });
  
  // Total views (sum of view counts for all posts)
  const totalViewsResult = await prisma.post.aggregate({
    _sum: {
      viewCount: true
    }
  });
  const totalViews = totalViewsResult._sum.viewCount || 0;
  
  // Get recent posts
  let recentPostsQuery = {};
  
  // If user is Editor, only show their posts
  const userRoles = user.roles?.map((r: any) => r.role?.name) || [];
  const isEditor = userRoles.includes('EDITOR') && 
                  !userRoles.some((r: string) => ['SUPER_ADMIN', 'EDITOR_IN_CHIEF', 'EDITORIAL', 'SENIOR_EDITOR'].includes(r));
  
  if (isEditor) {
    recentPostsQuery = {
      where: { authorId: user.id }
    };
  }
  
  const recentPosts = await prisma.post.findMany({
    ...recentPostsQuery,
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      status: true,
      createdAt: true,
      authorId: true,
      author: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });
  
  // Get posts per category
  const categoriesWithPostCount = await prisma.category.findMany({
    select: {
      id: true,
      _count: {
        select: { posts: true }
      }
    },
    orderBy: {
      id: 'asc'
    }
  });
  
  const postsPerCategory = categoriesWithPostCount.map((category: any) => ({
    name: `Category ${category.id}`,
    count: category._count.posts
  }));
  
  // Get posts per status
  const postStatusCounts = await prisma.$queryRaw`
    SELECT status, COUNT(*) as count 
    FROM "Post" 
    GROUP BY status
  `;
  
  // Get views over time for the last 30 days
  const viewsOverTime = [];
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // In a real app, this would be querying a metrics table
    // For demo, generating some random data
    const views = Math.floor(Math.random() * 500) + 100;
    
    viewsOverTime.push({
      date: formattedDate,
      views
    });
  }
  
  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    scheduledPosts,
    totalViews,
    totalUsers,
    activeUsers,
    pendingApprovals,
    recentPosts: recentPosts.map((post: any) => ({
      id: post.id,
      title: `Post ${post.id}`, // Since there's no title field, use ID
      status: post.status,
      createdAt: post.createdAt.toISOString(),
      author: {
        name: post.author?.email || 'Unknown',
        image: null // No image field available
      }
    })),
    postsPerCategory,
    postsPerStatus: postStatusCounts,
    viewsOverTime,
    userRole: isEditor ? 'EDITOR' : 'ADMIN'
  };
} 