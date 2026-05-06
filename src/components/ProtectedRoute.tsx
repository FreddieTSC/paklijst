import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { Spinner } from './Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const { isLoading: hhLoading } = useHousehold();

  if (authLoading || hhLoading) return <Spinner full />;
  return <>{children}</>;
}
