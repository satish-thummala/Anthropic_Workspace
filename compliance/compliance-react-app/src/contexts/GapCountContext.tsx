import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { gapAPI } from '../services/gap-api';

interface GapCountContextType {
  openGapCount: number;
  refreshGapCount: () => Promise<void>;
  isLoading: boolean;
}

const GapCountContext = createContext<GapCountContextType | undefined>(undefined);

export function GapCountProvider({ children }: { children: ReactNode }) {
  const [openGapCount, setOpenGapCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshGapCount = async () => {
    try {
      setIsLoading(true);
      const stats = await gapAPI.getStats();
      setOpenGapCount(stats.totalOpen);
    } catch (error) {
      console.error('Failed to fetch gap count:', error);
      // Keep previous count on error
    } finally {
      setIsLoading(false);
    }
  };

  // Load gap count on mount
  useEffect(() => {
    refreshGapCount();
  }, []);

  return (
    <GapCountContext.Provider value={{ openGapCount, refreshGapCount, isLoading }}>
      {children}
    </GapCountContext.Provider>
  );
}

export function useGapCount() {
  const context = useContext(GapCountContext);
  if (context === undefined) {
    throw new Error('useGapCount must be used within a GapCountProvider');
  }
  return context;
}
