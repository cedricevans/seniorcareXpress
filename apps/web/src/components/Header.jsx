import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { isAuthenticated, role, currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Veterans Benefits', path: '/veterans' },
    { name: 'Careers', path: '/careers' },
    { name: 'Contact', path: '/contact' },
  ];

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin';
    if (role === 'caregiver') return '/caregiver';
    if (role === 'family') return '/family';
    return '/';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 transition-all duration-300">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src="https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/6cf179a531307fd05365d487c05a8a26.png" 
            alt="SeniorCare Xpress Logo" 
            className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`text-base font-medium transition-all duration-200 hover:text-primary relative py-2 ${
                location.pathname === link.path ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.name}
              {location.pathname === link.path && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-secondary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-4">
              <Link to={getDashboardLink()}>
                <Button variant="ghost" className="font-medium text-base">Dashboard</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded-full pl-3 pr-4 border-primary/20 hover:bg-primary/5">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium text-base hidden sm:inline-block">
                      {currentUser?.name || currentUser?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-elegant border-border/50">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mt-2">{role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button className="font-medium rounded-full px-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  Access Care Portal
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Drawer>
            <DrawerTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="rounded-t-3xl">
              <div className="flex flex-col gap-4 p-6 mt-4 pb-10">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path} 
                    to={link.path}
                    className={`text-lg font-medium p-3 rounded-xl transition-colors ${
                      location.pathname === link.path ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="h-px bg-border my-2" />
                {isAuthenticated ? (
                  <>
                    <Link to={getDashboardLink()} className="text-lg font-medium p-3 hover:bg-muted rounded-xl">
                      Dashboard
                    </Link>
                    <Button variant="destructive" onClick={handleLogout} className="mt-4 rounded-xl h-12 text-lg">
                      Log out
                    </Button>
                  </>
                ) : (
                  <Link to="/login" className="w-full mt-2">
                    <Button className="w-full font-medium rounded-xl h-12 text-lg">Access Care Portal</Button>
                  </Link>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
};

export default Header;