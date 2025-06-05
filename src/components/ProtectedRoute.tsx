
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neomorphism-background flex items-center justify-center">
        <div className="neomorphism-card p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neomorphism-blue mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
