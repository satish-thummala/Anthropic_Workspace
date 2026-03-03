import React from 'react';
import type { PageId, User } from '../../types/compliance.types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
  page: PageId;
  setPage: (p: PageId) => void;
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppLayout({ page, setPage, user, onLogout, children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} user={user} onLogout={onLogout} />
      <div className="main">
        <Topbar page={page} user={user} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
