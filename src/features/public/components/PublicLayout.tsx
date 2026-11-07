import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { PublicAction } from '../../../components/ui/PublicAction';
import { usePublicAppearance } from '../hooks/usePublicAppearance';
import '../styles/public.css';
import '../styles/legal.css';

export function PublicBrand() {
  return <Link to="/" className="public-brand" aria-label="Comerzia, inicio"><img src="/shop_trim.png" alt="" width={32} height={32} />comerzia</Link>;
}
export function PublicLayout() {
  const { theme, toggle } = usePublicAppearance();
  const location = useLocation();
  useEffect(() => {
    document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', '/shop_trim.png');
    document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.setAttribute('href', '/shop_trim.png');
    document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute('href', '/manifest.json');
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
    robots.content = ['/', '/privacy-policy', '/terms-and-conditions'].includes(location.pathname) ? 'index,follow' : 'noindex,nofollow';
  }, [location.pathname]);
  return <div className="public-site" data-public-theme={theme}>
    <div className="public-theme-toggle"><PublicAction type="button" className="public-icon-button" onClick={toggle} aria-label={theme === 'light' ? 'Usar modo oscuro' : 'Usar modo claro'}>
      {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
    </PublicAction></div>
    <Outlet />
    {!['/privacy-policy', '/terms-and-conditions'].includes(location.pathname) && <nav className="public-legal-links" aria-label="Documentos legales"><Link to="/privacy-policy">Política de privacidad</Link><Link to="/terms-and-conditions">Términos y condiciones</Link></nav>}
  </div>;
}
