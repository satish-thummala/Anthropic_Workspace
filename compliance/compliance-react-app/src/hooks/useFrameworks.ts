import { useState, useEffect, useCallback } from 'react';
import { frameworkAPI } from '../services/framework-api';
import type { ApiFrameworkSummary, ApiFrameworkDetail, ApiControl } from '../types/compliance.types';

// ─── useFrameworks ────────────────────────────────────────────────────────────

export function useFrameworks() {
  const [frameworks, setFrameworks] = useState<ApiFrameworkSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await frameworkAPI.getAll();
      setFrameworks(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load frameworks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { frameworks, setFrameworks, loading, error, reload: load };
}

// ─── useFrameworkDetail ───────────────────────────────────────────────────────

export function useFrameworkDetail(code: string | null) {
  const [detail,  setDetail]  = useState<ApiFrameworkDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async (fwCode: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await frameworkAPI.getDetail(fwCode);
      setDetail(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load framework details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (code) load(code);
    else setDetail(null);
  }, [code, load]);

  // Patch a single control in local state after coverage toggle
  const updateControlLocally = useCallback((updated: ApiControl) => {
    setDetail(prev => {
      if (!prev) return prev;
      const controls     = prev.controls.map(c => c.id === updated.id ? updated : c);
      const coveredCount = controls.filter(c => c.isCovered).length;
      return {
        ...prev,
        controls,
        coveredControls:    coveredCount,
        coveragePercentage: prev.totalControls === 0
          ? 0
          : Math.round((coveredCount / prev.totalControls) * 100),
      };
    });
  }, []);

  return { detail, loading, error, reload: () => code && load(code), updateControlLocally };
}
