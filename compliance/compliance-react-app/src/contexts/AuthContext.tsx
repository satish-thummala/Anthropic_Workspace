import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types/compliance.types';
import { MOCK_USERS } from '../constants/mockData';

interface UserWithPassword extends User { password: string; }

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = localStorage.getItem('compliance_user');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 900));
    const found = (MOCK_USERS as UserWithPassword[]).find(
      u => u.email === email && u.password === password
    );
    if (found) {
      const { password: _pw, ...safeUser } = found as UserWithPassword;
      setUser(safeUser);
      try { localStorage.setItem('compliance_user', JSON.stringify(safeUser)); } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    try { localStorage.removeItem('compliance_user'); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
