import React, { createContext, useContext, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { TeamMember } from '../types/team.types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getDefaultColor } from '../constants/colors';

interface TeamContextValue {
  members: TeamMember[];
  addMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, updates: Partial<Omit<TeamMember, 'id' | 'createdAt'>>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => TeamMember | undefined;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

const STORAGE_KEY = 'chore-app-team-members';

export function TeamProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useLocalStorage<TeamMember[]>(STORAGE_KEY, []);

  const addMember = (member: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const newMember: TeamMember = {
      ...member,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setMembers([...members, newMember]);
  };

  const updateMember = (id: string, updates: Partial<Omit<TeamMember, 'id' | 'createdAt'>>) => {
    setMembers(
      members.map((member) =>
        member.id === id ? { ...member, ...updates } : member
      )
    );
  };

  const deleteMember = (id: string) => {
    setMembers(members.filter((member) => member.id !== id));
  };

  const getMemberById = (id: string): TeamMember | undefined => {
    return members.find((member) => member.id === id);
  };

  return (
    <TeamContext.Provider
      value={{
        members,
        addMember,
        updateMember,
        deleteMember,
        getMemberById,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}

/**
 * Hook to get the next available default color for a new member
 */
export function useNextDefaultColor() {
  const { members } = useTeam();
  return getDefaultColor(members.length);
}
