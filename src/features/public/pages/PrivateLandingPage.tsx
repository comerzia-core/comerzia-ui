import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Users, BarChart3, Store, ScanBarcode, Wallet } from 'lucide-react';
import { usePlatformConfig } from '../../../hooks/usePlatformConfig';

const features = [
  { icon: ScanBarcode, title: 'Catálogo y variantes', text: 'Organiza productos, presentaciones, marcas y códigos de barras.' },
  { icon: Boxes, title: 'Inventario por sucursal', text: 'Consulta existencias y registra entradas y movimientos de tus productos.' },
  { icon: Wallet, title: 'Ventas y caja', text: 'Gestiona pedidos, ventas, cobros y turnos de caja desde un mismo espacio.' },
  { icon: Users, title: 'Equipo y permisos', text: 'Asigna responsabilidades y accesos según el trabajo de cada persona.' },
  { icon: BarChart3, title: 'Consultas y reportes', text: 'Revisa ventas, inventario y movimientos para acompañar tus decisiones.' },
  { icon: Store, title: 'Operación conectada', text: 'Mantén a tu equipo y tus sucursales trabajando con la misma información.' },
];

export function PrivateLandingPage() {
  const { data } = usePlatformConfig();
  const brand = data?.brandName || 'Comerzia ERP';
  useEffect(() => { document.title = `${brand} · Gestión empresarial`; }, [brand]);
  return <>
    <header className="bg-base-100 border-b border-base-300">
      <nav aria-label="Navegación principal" className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 font-black text-lg"><img src="/shop_trim.png" alt="" className="w-9 h-9" />{brand}</Link>
        <Link to="/login" className="btn btn-primary btn-sm sm:btn-md">Iniciar sesión <ArrowRight size={17} /></Link>
      </nav>
    </header>
    <main>
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="space-y-6">
          <span className="badge badge-primary badge-outline p-4">GESTIÓN EMPRESARIAL</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">Tu operación,<br /><span className="text-primary">bien conectada.</span></h1>
          <p className="text-base sm:text-lg text-base-content/70 max-w-lg leading-relaxed">Productos, inventario, ventas y equipo. Un espacio para organizar el trabajo diario y tener una visión clara de tu negocio.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/login" className="btn btn-primary">Acceder a mi empresa <ArrowRight size={18} /></Link>
            <a href="#modules" className="link link-hover font-semibold">Conocer las funciones</a>
          </div>
          <p className="text-sm text-base-content/60">Acceso para el personal autorizado de tu organización.</p>
        </div>
        <figure className="relative rounded-3xl overflow-hidden shadow-xl border border-base-300 bg-base-100">
          <img src="/media/landing/merchants-poster.webp" alt="Personas atendiendo su negocio" className="w-full h-72 sm:h-96 lg:h-[480px] object-cover" fetchPriority="high" />
          <figcaption className="p-6 bg-base-100"><p className="font-bold text-lg">Más claridad para tu día a día</p><p className="text-sm text-base-content/65 mt-1">Información compartida. Trabajo organizado.</p></figcaption>
        </figure>
      </section>
      <section id="modules" className="bg-base-100 border-y border-base-300">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 lg:py-20">
          <p className="text-primary font-semibold text-sm tracking-widest mb-3">HERRAMIENTAS PARA TU EQUIPO</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Lo que necesitas, en un solo lugar.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-9">
            {features.map(({ icon: Icon, title, text }) => <article key={title} className="card bg-base-200 border border-base-300">
              <div className="card-body gap-3"><span className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center"><Icon size={23} /></span><h3 className="card-title text-lg">{title}</h3><p className="text-sm text-base-content/70 leading-relaxed">{text}</p></div>
            </article>)}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div><h2 className="text-2xl font-bold">Continúa con tu jornada.</h2><p className="text-base-content/65 mt-2">Entra con la cuenta que tu organización te ha asignado.</p></div>
        <Link to="/login" className="btn btn-primary">Iniciar sesión <ArrowRight size={18} /></Link>
      </section>
    </main>
  </>;
}
