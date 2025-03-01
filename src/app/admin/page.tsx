import React from 'react';

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-gray-600 mb-4">Welcome to the admin dashboard. Manage your application from here.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <DashboardCard 
            title="Users" 
            count="250" 
            icon="👥" 
            href="/admin/users" 
          />
          <DashboardCard 
            title="Content" 
            count="124" 
            icon="📄" 
            href="/admin/content" 
          />
          <DashboardCard 
            title="Settings" 
            count="15" 
            icon="⚙️" 
            href="/admin/settings" 
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <ActivityItem 
            action="User created" 
            subject="John Doe" 
            time="2 hours ago" 
          />
          <ActivityItem 
            action="Content updated" 
            subject="Homepage banner" 
            time="5 hours ago" 
          />
          <ActivityItem 
            action="Settings changed" 
            subject="Email notifications" 
            time="1 day ago" 
          />
        </div>
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ title, count, icon, href }: { 
  title: string; 
  count: string; 
  icon: string; 
  href: string;
}) {
  return (
    <a 
      href={href}
      className="block p-6 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </a>
  );
}

// Activity Item Component
function ActivityItem({ action, subject, time }: { 
  action: string; 
  subject: string; 
  time: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <div>
        <p className="font-medium">{action}</p>
        <p className="text-sm text-gray-500">{subject}</p>
      </div>
      <span className="text-xs text-gray-400">{time}</span>
    </div>
  );
} 