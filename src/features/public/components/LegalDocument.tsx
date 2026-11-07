import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { PublicBrand } from './PublicLayout';

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

export function LegalDocument({
  title,
  introduction,
  sections,
  isDraft = false
}: {
  title: string;
  introduction: string;
  sections: LegalSection[];
  isDraft?: boolean;
}) {
  useEffect(() => {
    document.title = `${title} · Comerzia`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="legal-document">
      <header className="legal-header public-container">
        <PublicBrand />
        <Link to="/">
          Volver al inicio <ArrowLeft size={16} />
        </Link>
      </header>
      <main className="public-container">
        <div className="legal-hero">
          <span className="public-eyebrow">
            <FileText size={16} /> INFORMACIÓN LEGAL
          </span>
          <h1>{title}</h1>
          <p>{introduction}</p>
          {isDraft && (
            <div className="legal-draft" role="note">
              <strong>Borrador pendiente de aprobación</strong>
              <p>
                Este documento describe el funcionamiento actual del servicio. Los datos y decisiones señalados al final deben confirmarse antes de publicarlo como versión definitiva o presentarlo a Google. No tiene fecha de entrada en vigor aprobada.
              </p>
            </div>
          )}
        </div>
        <div className="legal-grid">
          <aside>
            <nav aria-label="Contenido del documento">
              <span className="public-eyebrow">EN ESTA PÁGINA</span>
              {sections.map(section => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>
          <article>
            {sections.map((section, index) => (
              <section id={section.id} key={section.id} className="legal-section">
                <span className="legal-number">{String(index + 1).padStart(2, '0')}</span>
                <h2>{section.title}</h2>
                {section.content}
              </section>
            ))}
          </article>
        </div>
      </main>
      <footer className="legal-footer public-container">
        <span>Comerzia · Gestión para tu negocio</span>
        <nav aria-label="Documentos legales">
          <Link to="/privacy-policy">Política de privacidad</Link>
          <Link to="/terms-and-conditions">Términos y condiciones</Link>
        </nav>
      </footer>
    </div>
  );
}
