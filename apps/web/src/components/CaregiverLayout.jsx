
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const CaregiverLayout = ({ currentView, onNavigate, children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'My Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'availability', label: 'Availability', icon: Clock },
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    // Optionally sync with URL if needed, but state drives the view
    if (id === 'dashboard') {
      navigate('/caregiver');
    } else {
      navigate(`/caregiver/${id}`);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 shrink-0">
        <nav className="space-y-2 sticky top-24 bg-white p-4 rounded-2xl shadow-soft border border-border">
          <div className="mb-4 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Caregiver Menu
          </div>
          {navItems.map(item => {
            // Determine active state based on currentView prop
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
};

export default CaregiverLayout;
