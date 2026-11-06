import { Navigate, useLocation } from 'react-router-dom';

// Los enlaces históricos conservan query y fragmento hasta que el flujo consume su token.
export function LegacyPublicRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} replace />;
}
