import { useState, useCallback } from 'react';
import type { ToastMessage } from '../types/compliance.types';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const add = useCallback((msg: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, add, dismiss };
}
