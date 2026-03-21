
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null; // Or a full-page loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on actual role
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'caregiver') return <Navigate to="/caregiver" replace />;
    if (role === 'family') return <Navigate to="/family" replace />;
    if (role === 'patient') return <Navigate to="/patient" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
