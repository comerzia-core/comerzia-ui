import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BtnCancel, BtnSave } from './CrudButtons';

interface Props {
  file: File;
  onComplete: (file: File | null) => void;
}

export function ComerziaImageCropper({ file, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const cancelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const photo = new Image();
    photo.onload = () => setImage(photo);
    photo.onerror = () => setError('No se pudo abrir la imagen. Prueba con JPG, PNG o WEBP.');
    photo.src = url;
    cancelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      photo.onload = null;
      photo.onerror = null;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const scale = Math.max(3 / image.naturalWidth, 4 / image.naturalHeight) * zoom;
    const width = 3 / scale;
    const height = 4 / scale;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (image.naturalWidth - width) * horizontal / 100,
      (image.naturalHeight - height) * vertical / 100, width, height,
      0, 0, canvas.width, canvas.height);
  }, [image, zoom, horizontal, vertical]);

  const save = () => {
    setSaving(true);
    canvasRef.current?.toBlob(blob => {
      if (!blob) {
        setError('No se pudo preparar la imagen. Intenta nuevamente.');
        setSaving(false);
        return;
      }
      onComplete(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' }));
    }, 'image/png');
  };

  return createPortal(<div className="fixed inset-0 z-[11000] bg-black/70 flex items-center justify-center p-3"
    onKeyDown={event => {
      event.stopPropagation();
      if (event.key === 'Escape' && !saving) onComplete(null);
      if (event.key === 'Tab') {
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input'));
        const next = controls.indexOf(document.activeElement as HTMLElement) + (event.shiftKey ? -1 : 1);
        if (next < 0 || next >= controls.length) {
          event.preventDefault();
          controls[(next + controls.length) % controls.length]?.focus();
        }
      }
    }}>
    <section ref={cancelRef} role="dialog" aria-modal="true" aria-label="Encuadrar foto del producto" className="bg-base-100 rounded-2xl p-5 w-full max-w-md max-h-[95dvh] overflow-y-auto space-y-3">
      <h3 className="font-bold text-lg">Encuadrar foto del producto</h3>
      <p className="text-sm text-base-content/70">Ajusta la imagen al formato vertical 3:4. Comprueba que el producto quede completo.</p>
      <canvas ref={canvasRef} width={900} height={1200} aria-label="Vista previa del recorte" className="block mx-auto w-auto max-w-full h-[35dvh] aspect-[3/4] bg-base-200 rounded-lg" />
      <label className="block text-sm">Zoom<input aria-label="Zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="range range-sm block w-full" /></label>
      <label className="block text-sm">Posición horizontal<input aria-label="Posición horizontal" type="range" min="0" max="100" value={horizontal} onChange={event => setHorizontal(Number(event.target.value))} className="range range-sm block w-full" /></label>
      <label className="block text-sm">Posición vertical<input aria-label="Posición vertical" type="range" min="0" max="100" value={vertical} onChange={event => setVertical(Number(event.target.value))} className="range range-sm block w-full" /></label>
      {error && <p role="alert" className="text-error text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <BtnCancel type="button" onClick={() => onComplete(null)} disabled={saving} />
        <BtnSave type="button" label="Usar foto" onClick={save} disabled={!image || saving || !!error} />
      </div>
    </section>
  </div>, document.body);
}
