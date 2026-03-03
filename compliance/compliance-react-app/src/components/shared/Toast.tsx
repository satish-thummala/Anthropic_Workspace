import React from 'react';
import type { ToastMessage } from '../../types/compliance.types';
import { Icons } from './Icons';

interface ToastProps {
  toasts: ToastMessage[];
  dismiss: (id: number) => void;
}

export function Toast({ toasts, dismiss }: ToastProps) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
          <div className="toast-icon">
            {t.type === 'success' && <Icons.Check style={{ width: 18, height: 18, color: '#16A34A' }} />}
            {t.type === 'error'   && <Icons.X     style={{ width: 18, height: 18, color: '#DC2626' }} />}
            {t.type === 'info'    && <Icons.Zap   style={{ width: 18, height: 18, color: '#1D4ED8' }} />}
          </div>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
