
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Activity,
  Settings,
  PieChart,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PortalSidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Patients', path: '/admin/patients', icon: Users },
          { name: 'Caregivers', path: '/admin/caregivers', icon: Activity },
          { name: 'Appointments', path: '/admin/appointments', icon: Calendar },
          { name: 'Assignments', path: '/admin/assignments', icon: UserCheck },
          { name: 'Analytics', path: '/admin/analytics', icon: PieChart },
        ];
      case 'caregiver':
        return [
          { name: 'Dashboard', path: '/caregiver', icon: LayoutDashboard },
          { name: 'My Patients', path: '/caregiver/patients', icon: Users },
          { name: 'Appointments', path: '/caregiver/appointments', icon: Calendar },
          { name: 'Availability', path: '/caregiver/availability', icon: Clock },
        ];
      case 'family':
        return [
          { name: 'Dashboard', path: '/family', icon: LayoutDashboard },
          { name: 'Book Appointment', path: '/family/book-appointment', icon: Calendar },
          { name: 'Medical Records', path: '/family/medical-records', icon: FileText },
          { name: 'Messages', path: '/family/messages', icon: MessageSquare },
        ];
      case 'patient':
        return [
          { name: 'Dashboard', path: '/patient', icon: LayoutDashboard },
          { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
          { name: 'My Records', path: '/patient/medical-records', icon: FileText },
          { name: 'Messages', path: '/patient/messages', icon: MessageSquare },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-[hsl(var(--sidebar-border))]">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/6cf179a531307fd05365d487c05a8a26.png" 
              alt="SeniorCare Xpress Logo" 
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Menu
          </div>
          {navItems.map((item) => {
            // For this implementation, we map sidebar links to the main dashboard tabs
            // In a real multi-page app, these would be separate routes.
            // Here we just highlight the dashboard if we are on it.
            const isActive = location.pathname === item.path || (item.path !== `/${role}` && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[hsl(var(--sidebar-border))]">
          <Link
            to={`/${role}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
};

export default PortalSidebar;
