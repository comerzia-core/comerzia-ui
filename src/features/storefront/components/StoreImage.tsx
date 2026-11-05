import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getOptimizedImageUrl, CLOUDINARY_PRESETS } from '../../../utils/image';

export function StoreImage({ url, alt, preset = 'card', eager = false }: { url: string | null; alt: string; preset?: keyof typeof CLOUDINARY_PRESETS; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return <span className="store-image">{url && !failed
    ? <img src={getOptimizedImageUrl(url, preset)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
    : <span className="store-image-empty" aria-label="Sin imagen"><ImageOff size={28} strokeWidth={1} /></span>}</span>;
}
