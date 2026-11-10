import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BtnCancel, BtnSave } from './CrudButtons';
import { useImageCrop, type CropCorner } from '../../hooks/useImageCrop';

interface Props {
  file: File;
  aspect?: 'portrait' | 'square';
  onComplete: (file: File | null) => void;
}

const CORNERS: { corner: CropCorner; position: string; label: string }[] = [
  { corner: 'nw', position: 'top-0 left-0 cursor-nwse-resize', label: 'superior izquierda' },
  { corner: 'ne', position: 'top-0 right-0 cursor-nesw-resize', label: 'superior derecha' },
  { corner: 'sw', position: 'bottom-0 left-0 cursor-nesw-resize', label: 'inferior izquierda' },
  { corner: 'se', position: 'bottom-0 right-0 cursor-nwse-resize', label: 'inferior derecha' },
];

export function ComerziaImageCropper({ file, onComplete, aspect = 'portrait' }: Props) {
  const editor = useImageCrop(file, onComplete, aspect);
  const sectionRef = useRef<HTMLElement>(null);
  const { image, crop, saving } = editor;
  const title = aspect === 'square' ? 'Encuadrar foto de perfil' : 'Encuadrar foto del producto';

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    sectionRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previous?.focus();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[11000] bg-black/70 flex items-center justify-center p-3"
      onKeyDown={event => {
        event.stopPropagation();
        if (event.key === 'Escape' && !saving) onComplete(null);
        if (event.key === 'Tab') {
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'));
          const next = controls.indexOf(document.activeElement as HTMLElement) + (event.shiftKey ? -1 : 1);
          if (next < 0 || next >= controls.length) {
            event.preventDefault();
            controls[(next + controls.length) % controls.length]?.focus();
          }
        }
      }}>
      <section ref={sectionRef} role="dialog" aria-modal="true" aria-label={title}
        className="bg-base-100 rounded-2xl p-4 sm:p-5 w-full max-w-2xl max-h-[95dvh] overflow-y-auto space-y-4">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-base-content/70">Mueve el recuadro y arrastra sus esquinas para ajustar el encuadre {aspect === 'square' ? 'cuadrado 1:1' : 'vertical 3:4'}.</p>
        <div className="flex justify-center bg-base-200 rounded-lg p-2">
          <div className="relative overflow-hidden select-none leading-none" data-testid="crop-stage">
            {editor.source && <img ref={editor.imageRef} src={editor.source} alt={aspect === 'square' ? 'Foto original de perfil' : 'Foto original del producto'} draggable={false}
              className="block max-w-full max-h-[55dvh] w-auto h-auto" />}
            {image && <div role="group" aria-label="Área de recorte" tabIndex={0}
              className="absolute border-2 border-white bg-white/5 cursor-move touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              style={{ left: `${crop.x / image.naturalWidth * 100}%`, top: `${crop.y / image.naturalHeight * 100}%`,
                width: `${crop.width / image.naturalWidth * 100}%`, height: `${crop.height / image.naturalHeight * 100}%`,
                boxShadow: '0 0 0 9999px rgb(0 0 0 / 55%)' }}
              onPointerDown={event => editor.start(event)} onPointerMove={editor.move}
              onPointerUp={editor.end} onPointerCancel={editor.end} onLostPointerCapture={editor.end}
              onKeyDown={event => {
                if (event.target !== event.currentTarget) return;
                switch (event.key) {
                  case 'ArrowLeft': event.preventDefault(); editor.nudge(-1, 0); break;
                  case 'ArrowRight': event.preventDefault(); editor.nudge(1, 0); break;
                  case 'ArrowUp': event.preventDefault(); editor.nudge(0, -1); break;
                  case 'ArrowDown': event.preventDefault(); editor.nudge(0, 1); break;
                }
              }}>
              <div aria-hidden="true" className="absolute inset-0 pointer-events-none" data-testid="crop-grid">
                <div className="absolute inset-y-0 left-1/3 border-l border-white/40" />
                <div className="absolute inset-y-0 left-2/3 border-l border-white/40" />
                <div className="absolute inset-x-0 top-1/3 border-t border-white/40" />
                <div className="absolute inset-x-0 top-2/3 border-t border-white/40" />
              </div>
              {CORNERS.map(({ corner, position, label }) => <div key={corner} role="slider" tabIndex={0}
                aria-label={`Redimensionar desde esquina ${label}`} aria-valuemin={10} aria-valuemax={100}
                aria-valuenow={Math.round(crop.width / Math.min(image.naturalWidth, image.naturalHeight * editor.ratio) * 100)}
                className={`absolute w-8 h-8 touch-none flex items-center justify-center ${position}`}
                onPointerDown={event => editor.start(event, corner)}
                onKeyDown={event => {
                  if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(event.key)) {
                    event.preventDefault();
                    editor.grow(corner, event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1);
                  }
                }}>
                <span aria-hidden="true" className="w-3 h-3 rounded-full bg-white shadow border border-black/20" />
              </div>)}
            </div>}
          </div>
        </div>
        {editor.error && <p role="alert" className="text-error text-sm">{editor.error}</p>}
        <div className="flex justify-end gap-2">
          <BtnCancel type="button" responsive={true} onClick={() => onComplete(null)} disabled={saving} />
          <BtnSave type="button" responsive={true} label="Guardar foto" onClick={editor.save} disabled={!image || saving || !!editor.error} />
        </div>
      </section>
    </div>, document.body);
}
