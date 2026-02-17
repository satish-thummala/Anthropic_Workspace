import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { Chore, ChoreInstance } from '../types/chore.types';
import { generateChoreInstances } from '../utils/recurrenceUtils';
import { useTeam } from './TeamContext';
import { apiRequest, API_ENDPOINTS } from '../utils/api';

interface ChoreContextValue {
  chores: Chore[];
  addChore: (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateChore: (id: string, updates: Partial<Omit<Chore, 'id' | 'createdAt'>>) => Promise<void>;
  deleteChore: (id: string) => Promise<void>;
  getChoreById: (id: string) => Chore | undefined;
  getChoreInstances: (startDate: Date, endDate: Date) => ChoreInstance[];
  refreshChores: () => Promise<void>;
  isLoading: boolean;
}

const ChoreContext = createContext<ChoreContextValue | undefined>(undefined);

export function ChoreProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getMemberById } = useTeam();

  // Fetch chores from API on mount
  const refreshChores = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(API_ENDPOINTS.CHORES);
      // Ensure we always set an array, never undefined/null
      setChores(Array.isArray(response.chores) ? response.chores : []);
    } catch (error) {
      console.error('Failed to fetch chores:', error);
      setChores([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshChores();
  }, []);

  const addChore = async (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.CHORES, {
        method: 'POST',
        body: JSON.stringify(chore),
      });
      setChores((prev) => [...prev, response.chore]);
    } catch (error) {
      console.error('Failed to add chore:', error);
      throw error;
    }
  };

  const updateChore = async (id: string, updates: Partial<Omit<Chore, 'id' | 'createdAt'>>) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.CHORE_BY_ID(id), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setChores((prev) => prev.map((chore) => (chore.id === id ? response.chore : chore)));
    } catch (error) {
      console.error('Failed to update chore:', error);
      throw error;
    }
  };

  const deleteChore = async (id: string) => {
    try {
      await apiRequest(API_ENDPOINTS.CHORE_BY_ID(id), {
        method: 'DELETE',
      });
      setChores((prev) => prev.filter((chore) => chore.id !== id));
    } catch (error) {
      console.error('Failed to delete chore:', error);
      throw error;
    }
  };

  const getChoreById = (id: string): Chore | undefined => {
    return chores.find((chore) => chore.id === id);
  };

  // Pass the full chores array and getMemberById - matching the original function signature:
  // generateChoreInstances(chores[], startDate, endDate, getMemberById)
  const getChoreInstances = (startDate: Date, endDate: Date): ChoreInstance[] => {
    if (!Array.isArray(chores) || chores.length === 0) return [];
    // Guard: ensure every chore has a valid recurrence object before passing to generator
    const safeChores = chores.filter(
      (c) => c.recurrence && typeof c.recurrence.type === 'string'
    );
    if (safeChores.length === 0) return [];
    return generateChoreInstances(safeChores, startDate, endDate, getMemberById);
  };

  const value: ChoreContextValue = {
    chores,
    addChore,
    updateChore,
    deleteChore,
    getChoreById,
    getChoreInstances,
    refreshChores,
    isLoading,
  };

  return <ChoreContext.Provider value={value}>{children}</ChoreContext.Provider>;
}

export function useChores() {
  const context = useContext(ChoreContext);
  if (context === undefined) {
    throw new Error('useChores must be used within a ChoreProvider');
  }
  return context;
}
