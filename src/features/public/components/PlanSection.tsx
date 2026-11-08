import { Link } from 'react-router-dom';
import { ArrowRight, Check, RefreshCw } from 'lucide-react';
import { PublicAction } from '../../../components/ui/PublicAction';
import { usePublicPlans } from '../hooks/usePublicCatalog';

export function PlanSection() {
  const { data, isPending, isError, refetch } = usePublicPlans();
  return <section className="public-plans public-container" id="planes"><div className="public-section-heading"><span className="public-eyebrow">A TU RITMO</span><h2>Empieza pequeño.<br />Piensa en grande.</h2><p>Elige un espacio para cada etapa de tu negocio.</p></div>
    {isPending ? <div role="status" className="public-plan-loading">Cargando planes…</div> : isError ? <div className="public-plan-loading"><p>No pudimos cargar los planes.</p><PublicAction onClick={() => void refetch()}><RefreshCw size={16} /> Reintentar</PublicAction></div> :
      <div className="public-plan-grid">{data?.map(plan => <article key={plan.code} className={`public-plan ${plan.registrationAvailable ? 'public-plan--free' : ''}`}>
        <div><span className="public-plan-label">{plan.registrationAvailable ? 'TU PUNTO DE PARTIDA' : 'PARA SEGUIR CRECIENDO'}</span><h3>{plan.name}</h3><p className="public-plan-price"><span>Bs</span> {Number(plan.monthlyPrice).toLocaleString('es-BO', { maximumFractionDigits: 2 })}<small>/ mes</small></p></div>
        <ul><li><Check size={16} />{plan.maxBranches.toLocaleString('es-BO')} {plan.maxBranches === 1 ? 'tienda' : 'tiendas'}</li><li><Check size={16} />{plan.maxUsers.toLocaleString('es-BO')} {plan.maxUsers === 1 ? 'usuario (tú)' : 'usuarios'}</li><li><Check size={16} />{plan.maxProducts.toLocaleString('es-BO')} productos</li></ul>
        {plan.registrationAvailable ? <Link className="public-action public-action--outline" to="/register">Comenzar gratis <ArrowRight size={18} /></Link> : <div className="public-plan-upcoming">Contratación próximamente</div>}
      </article>)}</div>}
    <p className="public-plan-note">El registro inicial incluye Free. Sin tarjeta y sin cobros automáticos.</p>
  </section>;
}
