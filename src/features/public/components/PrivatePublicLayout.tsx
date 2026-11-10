import { Link, Outlet } from 'react-router-dom';
import { usePlatformConfig } from '../../../hooks/usePlatformConfig';
import '../styles/private-public.css';

export function PrivatePublicLayout() {
  const { data } = usePlatformConfig();
  return <div className="private-public min-h-screen bg-base-200 text-base-content flex flex-col">
    <div className="flex-1"><Outlet /></div>
    <footer className="border-t border-base-300 bg-base-100 px-5 py-6">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-4 text-sm">
        <Link to="/" className="font-bold">{data?.brandName || 'Comerzia ERP'}</Link>
        <nav aria-label="Documentos legales" className="flex flex-wrap gap-5">
          <Link className="link link-hover" to="/privacy-policy">Política de privacidad</Link>
          <Link className="link link-hover" to="/terms-and-conditions">Términos y condiciones</Link>
        </nav>
      </div>
    </footer>
  </div>;
}
