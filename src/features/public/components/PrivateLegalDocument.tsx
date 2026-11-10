import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import type { LegalSection } from './LegalDocument';

export function PrivateLegalDocument({ title, introduction, sections }: { title: string; introduction: string; sections: LegalSection[]; isDraft?: boolean }) {
  useEffect(() => { document.title = `${title} · Acceso empresarial`; }, [title]);
  return <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
    <Link to="/" className="inline-flex items-center gap-2 link link-hover text-sm mb-8"><ArrowLeft size={16} />Volver al inicio</Link>
    <div className="card bg-base-100 border border-base-300 shadow-sm"><div className="card-body p-6 sm:p-10">
      <FileText className="text-primary" size={30} /><h1 className="text-3xl sm:text-4xl font-bold my-3">{title}</h1>
      <p className="text-base-content/70 leading-relaxed mb-5">{introduction}</p>
      {sections.map(section => <section key={section.id} id={section.id} className="py-5 border-t border-base-300 space-y-3 leading-relaxed text-base-content/80">
        <h2 className="text-xl font-bold text-base-content">{section.title}</h2>{section.content}
      </section>)}
    </div></div>
  </main>;
}
