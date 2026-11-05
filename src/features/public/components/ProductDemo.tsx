import { ArrowUpRight, ChartNoAxesCombined, LayoutDashboard, Package, ShoppingBag, Store, Users } from 'lucide-react';

export function ProductDemo() {
  return <div className="public-demo" aria-label="Vista ilustrativa de Comerzia, con datos de ejemplo">
    <div className="public-demo-top"><span className="public-demo-dots"><i /><i /><i /></span><span>Mi negocio / Resumen</span><span className="public-demo-live">Todo en orden</span></div>
    <div className="public-demo-body"><aside className="public-demo-sidebar"><strong>C.</strong><LayoutDashboard size={18} /><ShoppingBag size={18} /><Package size={18} /><Users size={18} /><Store size={18} /></aside>
      <div className="public-demo-main"><div className="public-demo-heading"><div><small>BUEN DÍA, ANA</small><h3>Así va tu negocio</h3></div><span>Hoy <ArrowUpRight size={14} /></span></div>
        <div className="public-demo-stats"><div><span>Ventas de hoy</span><strong>Bs 2.450<span>,00</span></strong><small>Tu día, de un vistazo</small></div><div><span>Ventas realizadas</span><strong>28</strong><small>Todo registrado</small></div></div>
        <div className="public-demo-chart"><div><strong>Tu semana</strong><ChartNoAxesCombined size={17} /></div><div className="public-demo-bars">{[42, 62, 48, 81, 58, 95, 74].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}</span></div>)}</div></div>
        <div className="public-demo-bottom"><span><i />Tienda Centro</span><span>Ventas · Productos · Equipo</span></div>
      </div></div><div className="public-demo-caption">Vista de ejemplo · datos ilustrativos</div>
  </div>;
}
