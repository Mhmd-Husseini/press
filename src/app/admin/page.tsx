'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BarChart, LineChart, PieChart } from '@/components/ui/charts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { AlertCircle, ArrowUpRight, Clock, Eye, FileText, Pencil, Plus, TrendingUp, Users } from 'lucide-react';

interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalViews: number;
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  recentPosts: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    author: {
      name: string;
      image?: string;
    };
  }>;
  postsPerCategory: Array<{
    name: string;
    count: number;
  }>;
  postsPerStatus: Array<{
    status: string;
    count: number;
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
  userRole: string;
}

export default function AdminHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'waiting_approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get status label
  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'scheduled':
        return 'Scheduled';
      case 'waiting_approval':
        return 'Review';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium">Error Loading Dashboard</h3>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Prepare chart data
  const categoryChartData = stats.postsPerCategory.map(category => ({
    name: category.name,
    value: category.count,
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
  }));

  const statusChartData = stats.postsPerStatus.map(status => {
    let color = '#6b7280';
    switch (status.status.toLowerCase()) {
      case 'published':
        color = '#10b981';
        break;
      case 'draft':
        color = '#6b7280';
        break;
      case 'scheduled':
        color = '#3b82f6';
        break;
      case 'waiting_approval':
        color = '#f59e0b';
        break;
    }
    return {
      name: getStatusLabel(status.status),
      value: status.count,
      color
    };
  });

  const viewsChartData = stats.viewsOverTime.map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.views
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || user?.email || 'User'}
          </p>
        </div>
        <Link 
          href="/admin/posts/new" 
          className="flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> 
          Create New Post
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} published · {stats.draftPosts} drafts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>+12% from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers} total registered users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Waiting for review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="editorial">Editorial</TabsTrigger>
          {stats.userRole === 'EDITOR' && (
            <TabsTrigger value="yours">Your Content</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>Post views over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <LineChart data={viewsChartData} height={350} />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
                <CardDescription>Posts by status</CardDescription>
              </CardHeader>
              <CardContent>
                <PieChart data={statusChartData} height={300} />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Posts per category</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <BarChart data={categoryChartData} height={300} />
              </CardContent>
            </Card>
            
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest content updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {stats.recentPosts.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={post.author.image} alt={post.author.name} />
                        <AvatarFallback>{post.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{post.title}</p>
                        <p className="text-sm text-muted-foreground">
                          By {post.author.name} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center space-x-2">
                        <Badge className={getStatusColor(post.status)}>
                          {getStatusLabel(post.status)}
                        </Badge>
                        <Link href={`/admin/posts/${post.id}/edit`} className="p-1 rounded-md hover:bg-gray-100">
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="editorial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Editorial Calendar</CardTitle>
                <CardDescription>Upcoming content publication schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-center p-3 border rounded-md bg-gray-50">
                      <div className="w-16 text-center">
                        <div className="font-medium text-primary">
                          {new Date(post.createdAt).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleString('default', { month: 'short' })}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium">{post.title}</p>
                        <p className="text-sm text-muted-foreground">By {post.author.name}</p>
                      </div>
                      <Badge className={getStatusColor(post.status)}>
                        {getStatusLabel(post.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">Showing recent posts only</div>
                  <Link href="/admin/content" className="text-sm text-primary hover:underline">
                    View all posts
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Editorial Workflow</CardTitle>
                <CardDescription>Content approval process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold">
                        {stats.pendingApprovals}
                      </div>
                      <span className="ml-3 font-medium">Pending Approval</span>
                    </div>
                    <Link href="/admin/content?status=WAITING_APPROVAL" className="text-xs text-primary hover:underline">
                      View
                    </Link>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {stats.draftPosts}
                      </div>
                      <span className="ml-3 font-medium">Drafts</span>
                    </div>
                    <Link href="/admin/content?status=DRAFT" className="text-xs text-primary hover:underline">
                      View
                    </Link>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                        {stats.publishedPosts}
                      </div>
                      <span className="ml-3 font-medium">Published</span>
                    </div>
                    <Link href="/admin/content?status=PUBLISHED" className="text-xs text-primary hover:underline">
                      View
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Content Planning</CardTitle>
              <CardDescription>Topics and ideas for upcoming content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 p-4 border rounded-md bg-gray-50">
                  <h3 className="font-medium mb-2">Quick Content Ideas</h3>
                  <ul className="space-y-2 list-disc pl-5 text-sm">
                    <li>Top 10 trends in your industry</li>
                    <li>Interview with industry expert</li>
                    <li>How-to guide for beginners</li>
                    <li>Case study of successful implementation</li>
                    <li>Product review or comparison</li>
                  </ul>
                </div>
                <div className="flex-1 p-4 border rounded-md bg-gray-50">
                  <h3 className="font-medium mb-2">Editorial Guidelines</h3>
                  <p className="text-sm text-muted-foreground">
                    Remember to follow our content guidelines when creating new posts:
                  </p>
                  <ul className="space-y-2 list-disc pl-5 text-sm mt-2">
                    <li>Use clear, concise language</li>
                    <li>Include relevant keywords for SEO</li>
                    <li>Add at least one high-quality image</li>
                    <li>Provide actionable insights for readers</li>
                    <li>Fact-check all information before submission</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {stats.userRole === 'EDITOR' && (
          <TabsContent value="yours">
            <Card>
              <CardHeader>
                <CardTitle>Your Content</CardTitle>
                <CardDescription>Content authored or managed by you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {stats.recentPosts.map((post) => (
                    <div key={post.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{post.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center space-x-2">
                        <Badge className={getStatusColor(post.status)}>
                          {getStatusLabel(post.status)}
                        </Badge>
                        <Link href={`/admin/posts/${post.id}/edit`} className="p-1 rounded-md hover:bg-gray-100">
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 