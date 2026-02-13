import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: string | string[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  fallback = null
}) => {
  const { hasRole } = useAuth();

  if (hasRole(roles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};