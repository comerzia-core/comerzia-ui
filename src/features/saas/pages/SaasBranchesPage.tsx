import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function SaasBranchesPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/saas/tenants/${encodeURIComponent(id)}?tab=branches`, { replace: true });
  }, [id, navigate]);

  return null;
}
