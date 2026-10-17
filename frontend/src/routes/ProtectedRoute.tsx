import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex flex-col p-6 gap-6">
        <Skeleton className="h-14 w-full rounded-md" />
        <div className="flex-1 flex gap-6">
          <Skeleton className="w-64 h-full rounded-md hidden lg:block" />
          <div className="flex-1 flex flex-col gap-4">
            <Skeleton className="h-10 w-48 rounded" />
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
