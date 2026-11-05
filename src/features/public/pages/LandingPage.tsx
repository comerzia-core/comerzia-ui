import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowDown, ArrowRight, ChartNoAxesCombined, Palette, Store } from 'lucide-react';
import { BackgroundMedia } from '../components/BackgroundMedia';
import { PublicBrand } from '../components/PublicLayout';
import { ProductDemo } from '../components/ProductDemo';
import { PlanSection } from '../components/PlanSection';

export function LandingPage() {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  useEffect(() => { document.title = 'Comerzia · Tu negocio, en tus manos'; }, []);
  if (standalone) return <Navigate to="/app" replace />;
  return <>
    <section className="public-hero"><BackgroundMedia />
      <header className="public-nav public-container"><PublicBrand /><nav aria-label="Navegación principal"><a href="#producto">Cómo funciona</a><a href="#planes">Planes</a><Link className="public-nav-login" to="/app">Ir a mi empresa <ArrowUp /></Link></nav></header>
      <div className="public-hero-content public-container"><span className="public-eyebrow">EL SIGUIENTE PASO DE TU NEGOCIO</span><h1>Tu negocio,<br />en tus manos.</h1><p>Vende, organiza y conoce tu tienda.<br />Todo en un solo lugar, estés donde estés.</p><div className="public-hero-actions"><Link to="/registro" className="public-action">Empieza gratis <ArrowRight size={19} /></Link><a href="#producto" className="public-text-link">Conoce Comerzia <ArrowDown size={16} /></a></div><span className="public-hero-note">Tu empresa. Tu primera tienda. Tu espacio para crecer.</span></div>
      <div className="public-hero-bottom public-container"><span>DE LA PRIMERA VENTA AL PRÓXIMO LOCAL.</span><span>Desliza para descubrir <ArrowDown size={14} /></span></div>
    </section>
    <section className="public-product public-container" id="producto"><div className="public-product-copy"><span className="public-eyebrow">MÁS CLARIDAD, CADA DÍA</span><h2>Menos vueltas.<br />Más control.</h2><p>Deja de saltar entre cuadernos y pantallas. Encuentra lo importante y sigue con tu día.</p><Link to="/registro" className="public-text-link">Crea tu empresa <ArrowRight size={17} /></Link></div><ProductDemo />
      <div className="public-benefits"><article><Store size={23} /><h3>Tu tienda conectada</h3><p>Productos, ventas y equipo en el mismo espacio.</p></article><article><ChartNoAxesCombined size={23} /><h3>Números que se entienden</h3><p>Consulta tus ventas y el movimiento de tu negocio.</p></article><article><Palette size={23} /><h3>Hazlo tuyo</h3><p>Tu empresa, tu forma de trabajar y tu tema favorito.</p></article></div>
    </section>
    <PlanSection />
    <section className="public-final public-container"><span className="public-eyebrow">LO QUE VIENE EMPIEZA HOY</span><h2>Tu negocio ya tiene futuro.<br />Dale un lugar.</h2><Link to="/registro" className="public-action">Crear mi empresa gratis <ArrowRight size={19} /></Link></section>
    <footer className="public-footer public-container"><PublicBrand /><span>Una forma más simple de llevar tu negocio.</span><Link to="/app">Ir a mi empresa <ArrowRight size={16} /></Link></footer>
  </>;
}
function ArrowUp() { return <ArrowRight size={16} className="public-diagonal-arrow" />; }
