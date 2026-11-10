import { useEffect, useRef, useState, type PointerEvent } from 'react';

const RATIO = 3 / 4;
export type CropCorner = 'nw' | 'ne' | 'sw' | 'se';
interface Crop { x: number; y: number; width: number; height: number }
interface Gesture { pointerId: number; x: number; y: number; crop: Crop; corner?: CropCorner }
const clamp = (value: number, maximum: number) => Math.max(0, Math.min(value, maximum));

export function useImageCrop(file: File, onComplete: (file: File | null) => void) {
  const imageRef = useRef<HTMLImageElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [source, setSource] = useState('');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, width: 0, height: 0 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const photo = new Image();
    photo.onload = () => {
      const width = Math.min(photo.naturalWidth, photo.naturalHeight * RATIO);
      const height = width / RATIO;
      setImage(photo);
      setCrop({ x: (photo.naturalWidth - width) / 2, y: (photo.naturalHeight - height) / 2, width, height });
    };
    photo.onerror = () => setError('No se pudo abrir la imagen. Prueba con JPG, PNG o WEBP.');
    setSource(url);
    photo.src = url;
    return () => {
      photo.onload = null;
      photo.onerror = null;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const resize = (original: Crop, corner: CropCorner, requestedWidth: number): Crop => {
    if (!image) return original;
    const left = corner.endsWith('w');
    const top = corner.startsWith('n');
    const anchorX = left ? original.x + original.width : original.x;
    const anchorY = top ? original.y + original.height : original.y;
    const maximum = Math.min(left ? anchorX : image.naturalWidth - anchorX,
      (top ? anchorY : image.naturalHeight - anchorY) * RATIO);
    // Mantener espacio para arrastrar el centro incluso en pantallas pequeñas.
    const displayedWidth = imageRef.current?.getBoundingClientRect().width || image.naturalWidth;
    const minimum = Math.min(maximum, Math.max(
      Math.min(image.naturalWidth, image.naturalHeight * RATIO) / 10,
      image.naturalWidth * 72 / displayedWidth));
    const width = Math.max(minimum, Math.min(requestedWidth, maximum));
    const height = width / RATIO;
    return { x: left ? anchorX - width : anchorX, y: top ? anchorY - height : anchorY, width, height };
  };

  const start = (event: PointerEvent<HTMLElement>, corner?: CropCorner) => {
    if (!image || saving || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, crop, corner };
  };

  const move = (event: PointerEvent<HTMLElement>) => {
    const current = gesture.current;
    const bounds = imageRef.current?.getBoundingClientRect();
    if (!current || current.pointerId !== event.pointerId || !bounds || !image) return;
    const dx = (event.clientX - current.x) * image.naturalWidth / bounds.width;
    const dy = (event.clientY - current.y) * image.naturalHeight / bounds.height;
    if (current.corner) {
      const horizontal = current.corner.endsWith('w') ? -dx : dx;
      const vertical = current.corner.startsWith('n') ? -dy : dy;
      setCrop(resize(current.crop, current.corner, current.crop.width + (horizontal + vertical * RATIO) / 2));
    } else {
      setCrop({ ...current.crop, x: clamp(current.crop.x + dx, image.naturalWidth - current.crop.width),
        y: clamp(current.crop.y + dy, image.naturalHeight - current.crop.height) });
    }
  };

  const end = () => { gesture.current = null; };
  const nudge = (dx: number, dy: number) => {
    if (!image) return;
    setCrop(current => ({ ...current, x: clamp(current.x + dx * image.naturalWidth / 100, image.naturalWidth - current.width),
      y: clamp(current.y + dy * image.naturalHeight / 100, image.naturalHeight - current.height) }));
  };
  const grow = (corner: CropCorner, direction: number) => {
    if (image) setCrop(current => resize(current, corner, current.width + direction * image.naturalWidth / 100));
  };

  const save = () => {
    if (!image || saving) return;
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1200;
    const context = canvas.getContext('2d');
    if (!context) { setError('No se pudo preparar la imagen. Intenta nuevamente.'); return; }
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
    setSaving(true);
    canvas.toBlob(blob => {
      if (!blob) {
        setError('No se pudo preparar la imagen. Intenta nuevamente.');
        setSaving(false);
        return;
      }
      onComplete(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' }));
    }, 'image/png');
  };

  return { imageRef, source, image, crop, error, saving, start, move, end, nudge, grow, save };
}
