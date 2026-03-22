
import React, { useState, useContext, createContext, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return pb.authStore.model || null;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try { return pb.authStore.isValid; } catch { return false; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      if (pb.authStore.isValid && pb.authStore.model) {
        setCurrentUser(pb.authStore.model);
        setIsAuthenticated(true);
      }

      const unsubscribe = pb.authStore.onChange((token, model) => {
        setCurrentUser(model || null);
        setIsAuthenticated(!!token && !!model);
      });

      setLoading(false);

      return () => {
        try { unsubscribe(); } catch (error) {
          console.error('Error unsubscribing from auth changes:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      setCurrentUser(authData.record);
      setIsAuthenticated(true);
      return authData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      pb.authStore.clear();
      setCurrentUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const signup = async (data) => {
    try {
      const record = await pb.collection('users').create({
        ...data,
        emailVisibility: true,
      }, { $autoCancel: false });
      return record;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const getUserRole = () => currentUser?.role || null;

  const value = {
    currentUser,
    login,
    logout,
    signup,
    isAuthenticated,
    role: currentUser?.role || null,
    getUserRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
