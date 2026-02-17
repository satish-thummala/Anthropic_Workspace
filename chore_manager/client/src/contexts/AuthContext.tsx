import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, API_ENDPOINTS } from '../utils/api';

interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored session and validate token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('choreapp_user');

      if (token && storedUser) {
        try {
          // Validate token by fetching current user from API
          const userData = await apiRequest(API_ENDPOINTS.ME);
          setUser(userData);
        } catch (error) {
          // Token invalid, expired, OR server was restarted (user no longer in memory DB)
          // Silently clear stale credentials so user is shown the login screen
          localStorage.removeItem('authToken');
          localStorage.removeItem('choreapp_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Call real backend API
      const response = await apiRequest(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.token && response.user) {
        // Store token and user data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('choreapp_user', JSON.stringify(response.user));
        setUser(response.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint (optional, for server-side session cleanup)
      await apiRequest(API_ENDPOINTS.LOGOUT, { method: 'POST' });
    } catch (error) {
      // Even if API call fails, still logout locally
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('authToken');
      localStorage.removeItem('choreapp_user');
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return null; // Or a loading spinner component
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
