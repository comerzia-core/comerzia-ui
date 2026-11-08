import { Globe } from 'lucide-react';
import { AccessDeniedPage } from '../../errors/pages/AccessDeniedPage';
import { PublicCatalogSettings } from '../../storefront/components/PublicCatalogSettings';
import { CatalogProductSelection } from '../../storefront/components/CatalogProductSelection';
import { useCatalogAccess } from '../../storefront/hooks/useCatalogAccess';

export function PublicCatalogPage() {
  const access = useCatalogAccess();
  if (access.isPending) return <div className="py-12 text-center" role="status">Comprobando acceso…</div>;
  if (!access.allowed) return <AccessDeniedPage />;
  return <div className="space-y-6 w-full animate-fade-in">
    <header className="flex items-start gap-2.5"><Globe className="w-6 h-6 text-primary shrink-0 mt-0.5" /><div>
      <h1 className="text-lg sm:text-2xl font-bold">Catálogo público</h1>
      <p className="text-xs sm:text-sm text-base-content/60 mt-1">Elige qué mostrar y prepara tu página.</p>
    </div></header>
    <PublicCatalogSettings />
    <CatalogProductSelection />
  </div>;
}
