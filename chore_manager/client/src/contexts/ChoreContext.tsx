import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Chore, ChoreInstance } from '../types/chore.types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateChoreInstances } from '../utils/recurrenceUtils';
import { useTeam } from './TeamContext';

interface ChoreContextValue {
  chores: Chore[];
  addChore: (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateChore: (id: string, updates: Partial<Omit<Chore, 'id' | 'createdAt'>>) => void;
  deleteChore: (id: string) => void;
  getChoreById: (id: string) => Chore | undefined;
  getChoreInstances: (startDate: Date, endDate: Date) => ChoreInstance[];
}

const ChoreContext = createContext<ChoreContextValue | undefined>(undefined);

const STORAGE_KEY = 'chore-app-chores';

export function ChoreProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useLocalStorage<Chore[]>(STORAGE_KEY, []);
  const { getMemberById } = useTeam();

  const addChore = (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newChore: Chore = {
      ...chore,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setChores([...chores, newChore]);
  };

  const updateChore = (id: string, updates: Partial<Omit<Chore, 'id' | 'createdAt'>>) => {
    setChores(
      chores.map((chore) =>
        chore.id === id
          ? { ...chore, ...updates, updatedAt: new Date().toISOString() }
          : chore
      )
    );
  };

  const deleteChore = (id: string) => {
    setChores(chores.filter((chore) => chore.id !== id));
  };

  const getChoreById = (id: string): Chore | undefined => {
    return chores.find((chore) => chore.id === id);
  };

  const getChoreInstances = (startDate: Date, endDate: Date): ChoreInstance[] => {
    return generateChoreInstances(chores, startDate, endDate, getMemberById);
  };

  return (
    <ChoreContext.Provider
      value={{
        chores,
        addChore,
        updateChore,
        deleteChore,
        getChoreById,
        getChoreInstances,
      }}
    >
      {children}
    </ChoreContext.Provider>
  );
}

export function useChores() {
  const context = useContext(ChoreContext);
  if (context === undefined) {
    throw new Error('useChores must be used within a ChoreProvider');
  }
  return context;
}
