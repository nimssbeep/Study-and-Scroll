import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './lib/api';
import { AuthPage } from './pages/AuthPage';
import { FeedDashboard } from './pages/FeedDashboard';
import type { User } from './types';

export const App: React.FC = () => {
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiFetch<User>('/api/auth/me'),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] text-xs font-semibold text-slate-500">
        Loading Skrulla...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to="/feed" replace /> : <AuthPage />}
        />
        <Route
          path="/feed"
          element={user ? <FeedDashboard user={user} /> : <Navigate to="/auth" replace />}
        />
        <Route path="*" element={<Navigate to={user ? '/feed' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
