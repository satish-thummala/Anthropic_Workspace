import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { TeamMember } from '../types/team.types';
import { apiRequest, API_ENDPOINTS } from '../utils/api';
import { getDefaultColor } from '../constants/colors';

interface TeamContextValue {
  members: TeamMember[];
  addMember: (member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMember: (id: string, updates: Partial<Omit<TeamMember, 'id' | 'createdAt'>>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getMemberById: (id: string) => TeamMember | undefined;
  refreshMembers: () => Promise<void>;
  isLoading: boolean;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch team members from API on mount
  const refreshMembers = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest(API_ENDPOINTS.TEAM);
      setMembers(response.members || []);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMembers();
  }, []);

  const addMember = async (member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.TEAM, {
        method: 'POST',
        body: JSON.stringify(member),
      });

      setMembers((prev) => [...prev, response.member]);
    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  };

  const updateMember = async (
    id: string,
    updates: Partial<Omit<TeamMember, 'id' | 'createdAt'>>
  ) => {
    try {
      const response = await apiRequest(API_ENDPOINTS.TEAM_MEMBER(id), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      setMembers((prev) => prev.map((member) => (member.id === id ? response.member : member)));
    } catch (error) {
      console.error('Failed to update team member:', error);
      throw error;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await apiRequest(API_ENDPOINTS.TEAM_MEMBER(id), {
        method: 'DELETE',
      });

      setMembers((prev) => prev.filter((member) => member.id !== id));
    } catch (error) {
      console.error('Failed to delete team member:', error);
      throw error;
    }
  };

  const getMemberById = (id: string): TeamMember | undefined => {
    return members.find((member) => member.id === id);
  };

  const value: TeamContextValue = {
    members,
    addMember,
    updateMember,
    deleteMember,
    getMemberById,
    refreshMembers,
    isLoading,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}

// Hook to get the next default color based on current number of members
export function useNextDefaultColor(): string {
  const { members } = useTeam();
  return getDefaultColor(members.length);
}
