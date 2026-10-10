import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccountNotProvisioned } from '../pages/AccountNotProvisioned';
import { AccountDisabled } from '../pages/AccountDisabled';
import { UnauthorizedAccess } from '../pages/UnauthorizedAccess';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading, isProvisioned, isActive } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-medium text-stone-500">Verifying session permissions...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but account missing database profile / role
  if (!isProvisioned) {
    return <AccountNotProvisioned />;
  }

  // Authenticated but account is marked disabled
  if (isActive === false) {
    return <AccountDisabled />;
  }

  // Role authorization check
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(role);
    if (!hasRole) {
      return <UnauthorizedAccess />;
    }
  }

  return children;
}
