import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getOptimizedImageUrl, CLOUDINARY_PRESETS } from '../../../utils/image';

export function StoreImage({ url, alt, preset = 'card', eager = false, sizes = '(max-width: 700px) 45vw, (max-width: 1100px) 30vw, 320px' }: { url: string | null; alt: string; preset?: keyof typeof CLOUDINARY_PRESETS; eager?: boolean; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const portrait = preset === 'productPortrait' || preset === 'productDetail';
  const candidates = portrait ? [
    [getOptimizedImageUrl(url, 'productPortraitSmall'), 300],
    [getOptimizedImageUrl(url, 'productPortrait'), 600],
    [getOptimizedImageUrl(url, 'productDetail'), 900],
  ] as const : [];
  // Una URL externa o firmada conserva su contrato y no simula tamaños que no ofrece.
  const srcSet = new Set(candidates.map(([source]) => source)).size > 1
    ? candidates.map(([source, width]) => `${source} ${width}w`).join(', ') : undefined;
  return <span className="store-image">{url && !failed
    ? <img src={getOptimizedImageUrl(url, preset)} alt={alt} srcSet={srcSet} sizes={srcSet ? sizes : undefined} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
    : <span className="store-image-empty" aria-label="Sin imagen"><ImageOff size={28} strokeWidth={1} /></span>}</span>;
}
