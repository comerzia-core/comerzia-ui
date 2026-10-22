import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BackgroundMedia } from './BackgroundMedia';
import { PublicBrand } from './PublicLayout';

export function AuthStage({ children }: { children: ReactNode }) {
  return <main className="public-auth">
    <aside className="public-auth-story"><BackgroundMedia light /><div className="public-auth-brand"><PublicBrand /></div>
      <div className="public-auth-story-copy"><span className="public-eyebrow">MENOS COMPLICACIONES. MÁS NEGOCIO.</span>
        <h2>Tu próxima<br />gran etapa.</h2><p>Un espacio para tus ventas, tu equipo y todo lo que viene.</p></div>
      <span className="public-auth-story-note">Comerzia · Hecho para tu día a día</span>
    </aside>
    <section className="public-auth-content"><div className="public-auth-mobile-brand"><PublicBrand /></div>{children}
      <footer className="public-auth-footer"><Link to="/">Volver a Comerzia</Link><span>Tú haces crecer tu negocio.</span></footer>
    </section>
  </main>;
}
