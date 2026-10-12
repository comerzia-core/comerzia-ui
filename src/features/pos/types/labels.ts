export interface RollSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  active: boolean;
}

export type SaveRollSizeRequest = Omit<RollSize, 'id'>;

export interface LabelContent {
  variantId: string;
  productName: string;
  variantName: string;
  barcode: string;
  logoAvailable: boolean;
  priceAvailable: boolean;
  price: number | null;
  priceMessage: string | null;
}

export interface PreviewLabelRequest {
  variantId: string;
  rollSizeId: string;
  includeLogo: boolean;
  includePrice: boolean;
  includeName: boolean;
}

export interface LabelPreview {
  previewId: string;
  imageDataUrl: string;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  rotation: number;
  displayName: string;
  expiresAt: string;
}

export interface LabelPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
