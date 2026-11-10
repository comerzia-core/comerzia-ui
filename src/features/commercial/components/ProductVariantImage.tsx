import type { ComponentProps } from 'react';
import { ComerziaZoomableImage } from '../../../components/ui/ComerziaZoomableImage';

/** Miniatura completa; el visor conserva su versión ampliada independiente. */
export function ProductVariantImage(props: ComponentProps<typeof ComerziaZoomableImage>) {
  return <ComerziaZoomableImage preset="thumbnailFit" fit="contain" {...props} />;
}
