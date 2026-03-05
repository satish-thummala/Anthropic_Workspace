import { useState, useEffect, useCallback } from 'react';
import { gapAPI } from '../services/gap-api';
import type { ApiGap, ApiGapStats } from '../types/compliance.types';

interface GapFilters {
  framework?: string;
  status?:    string;
  severity?:  string;
  keyword?:   string;
}

export function useGaps(filters: GapFilters = {}) {
  const [gaps,    setGaps]    = useState<ApiGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Strip empty strings so we don't send ?framework= to backend
      const clean: GapFilters = {};
      if (filters.framework && filters.framework !== 'all') clean.framework = filters.framework;
      if (filters.status    && filters.status    !== 'all') clean.status    = filters.status;
      if (filters.severity  && filters.severity  !== 'all') clean.severity  = filters.severity;
      if (filters.keyword   && filters.keyword.trim())       clean.keyword   = filters.keyword.trim();

      const data = await gapAPI.getAll(clean);
      setGaps(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load gaps');
    } finally {
      setLoading(false);
    }
  }, [filters.framework, filters.status, filters.severity, filters.keyword]);

  useEffect(() => { load(); }, [load]);

  /** Patch a single gap in local state after a status/notes update — no refetch needed. */
  const updateGapLocally = useCallback((updated: ApiGap) => {
    setGaps(prev => prev.map(g => g.id === updated.id ? updated : g));
  }, []);

  return { gaps, loading, error, reload: load, updateGapLocally };
}

export function useGapStats() {
  const [stats,   setStats]   = useState<ApiGapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setStats(await gapAPI.getStats());
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load gap stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, error, reload: load };
}
