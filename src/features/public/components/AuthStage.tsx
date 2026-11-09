import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { PublicAction } from '../../../components/ui/PublicAction';
import { Link } from 'react-router-dom';
import { BackgroundMedia } from './BackgroundMedia';
import { PublicBrand } from './PublicLayout';
import { LockKeyhole } from 'lucide-react';
import { BtnRefresh } from '../../../components/ui/CrudButtons';

export function AuthStage({ children, privateMode = false, brandName = 'Comerzia ERP' }:
  { children: ReactNode; privateMode?: boolean; brandName?: string }) {
  const status = useAuthStore(state => state.status);
  const initialize = useAuthStore(state => state.initializeSession);
  useEffect(() => { if (status === 'initializing') void initialize(); }, [status, initialize]);
  if (privateMode) {
    return <main className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <header className="text-center mb-6">
            <div className="w-16 h-16 bg-primary text-primary-content rounded-2xl mx-auto flex items-center justify-center mb-4">
              <LockKeyhole size={32} />
            </div>
            <h2 className="text-2xl font-black">{brandName}</h2>
            <p className="text-base-content/60 text-sm">Seguridad de tu cuenta corporativa</p>
          </header>
          {status === 'initializing' ? <p role="status" className="text-center">Cargando…</p> :
            status === 'temporarily_unavailable' ? <div role="alert" className="space-y-4 text-center">
              <p>No se pudo conectar. Reintenta.</p>
              <BtnRefresh label="Reintentar" onClick={() => void initialize()} />
            </div> : children}
        </div>
      </div>
    </main>;
  }
  return <main className="public-auth">
    <aside className="public-auth-story"><BackgroundMedia light /><div className="public-auth-brand"><PublicBrand /></div>
      <div className="public-auth-story-copy"><span className="public-eyebrow">MENOS COMPLICACIONES. MÁS NEGOCIO.</span>
        <h2>Tu próxima<br />gran etapa.</h2><p>Un espacio para tus ventas, tu equipo y todo lo que viene.</p></div>
      <span className="public-auth-story-note">Comerzia · Hecho para tu día a día</span>
    </aside>
    <section className="public-auth-content"><div className="public-auth-mobile-brand"><PublicBrand /></div>{status === 'initializing' ? <p role="status">Cargando…</p> : status === 'temporarily_unavailable' ?
      <div role="alert">No se pudo conectar. <PublicAction onClick={() => void initialize()}>Reintentar</PublicAction></div> : children}
      <footer className="public-auth-footer"><Link to="/">Volver a Comerzia</Link><span>Tú haces crecer tu negocio.</span></footer>
    </section>
  </main>;
}
