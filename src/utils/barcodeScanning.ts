import { BarcodeFormat, DecodeHintType, MultiFormatReader, NotFoundException, ChecksumException, FormatException } from "@zxing/library";

// Conservar el lector de producción y admitir los QR de etiquetas pequeñas.
export const DEFAULT_BARCODE_FORMATS: BarcodeFormat[] = [
  BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
  BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF, BarcodeFormat.CODABAR,
  BarcodeFormat.QR_CODE,
];

export function createBarcodeHints(formats: BarcodeFormat[] = DEFAULT_BARCODE_FORMATS) {
  return new Map<DecodeHintType, unknown>([[DecodeHintType.POSSIBLE_FORMATS, formats]]);
}

export function isBarcodeReadMiss(error: unknown): boolean {
  return error instanceof NotFoundException || error instanceof ChecksumException || error instanceof FormatException;
}

export function createBarcodeReader(formats: BarcodeFormat[] = DEFAULT_BARCODE_FORMATS) {
  const reader = new MultiFormatReader();
  reader.setHints(createBarcodeHints(formats));
  return reader;
}
