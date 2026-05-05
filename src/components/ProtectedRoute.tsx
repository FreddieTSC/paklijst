import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { Spinner } from './Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: hh, isLoading: hhLoading } = useHousehold();

  if (authLoading) return <Spinner full />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (hhLoading) return <Spinner full />;

  // Logged in but no household yet → onboarding
  if (!hh?.household && loc.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}
