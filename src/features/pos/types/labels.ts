export interface RollSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  columns: number;
  columnGapMm: number;
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

export interface LabelPrintOptions {
  codeFormat: string;
  codeFormatLabel: string;
  logoAllowed: boolean;
  priceAllowed: boolean;
  nameAllowed: boolean;
  message: string | null;
  numbersVisible: boolean;
  codeModuleDots: number;
}

export interface LabelPreview {
  previewId: string;
  imageDataUrl: string;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  columns: number;
  columnGapMm: number;
  totalWidthMm: number;
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
