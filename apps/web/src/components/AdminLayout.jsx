import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Users, UserPlus, HeartHandshake, MessageSquare, Video, FileBarChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', label: 'Patients', icon: Users },
    { path: '/admin/caregivers', label: 'Caregivers', icon: HeartHandshake },
    { path: '/admin/families', label: 'Families', icon: UserPlus },
    { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { path: '/admin/video-calls', label: 'Video Calls', icon: Video },
    { path: '/admin/reports', label: 'Reports', icon: FileBarChart },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-muted/30">
      <aside className="w-full md:w-64 bg-white border-r shrink-0">
        <nav className="p-4 space-y-1 sticky top-20">
          <div className="mb-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin Dashboard
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;