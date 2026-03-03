import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../types/compliance.types";
import { authAPI, type LoginResponse } from "../services/api-client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("compliance_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Call real backend API
      const response: LoginResponse = await authAPI.login({ email, password });

      // Store tokens
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);

      // Map backend user to frontend User type
      const userData: User = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as "admin" | "analyst" | "viewer",
        organization: response.user.organization,
        avatar: response.user.avatar,
      };

      setUser(userData);
      localStorage.setItem("compliance_user", JSON.stringify(userData));

      return true;
    } catch (error: any) {
      console.error("Login failed:", error);

      // Clear any stored data on failure
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("compliance_user");

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Call backend logout (revokes refresh tokens)
      await authAPI.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("compliance_user");
      setIsLoading(false);
    }
  };

  // Check if token is valid on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("compliance_user");

      if (token && storedUser) {
        try {
          // Verify token is still valid
          await authAPI.getCurrentUser();
          // Token is valid, user already set from localStorage
        } catch (error) {
          // Token invalid, clear everything
          logout();
        }
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
