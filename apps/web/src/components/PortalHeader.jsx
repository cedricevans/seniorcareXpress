
import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Bell, Search, Menu, Globe, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

const PortalHeader = ({ onMenuClick }) => {
  const { currentUser, role, logout } = useAuth();

  const handleNotImplemented = () => {
    toast('This feature is coming soon.');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden md:flex items-center relative">
          <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="h-9 w-64 rounded-full bg-muted/50 border-transparent pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground" onClick={handleNotImplemented}>
          <Globe className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground relative" onClick={handleNotImplemented}>
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-card"></span>
        </Button>
        
        <div className="h-6 w-px bg-border mx-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 rounded-full pl-2 pr-3 hover:bg-muted/50 transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-none">{currentUser?.name || currentUser?.email || 'User'}</span>
                <span className="text-xs text-muted-foreground capitalize mt-1">{role}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={handleNotImplemented}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer rounded-lg">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default PortalHeader;
