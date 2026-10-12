import type { PageableObject, SortObject } from './pos';

/**
 * Códigos numéricos de diccionarios para validaciones operativas
 */
export const HwAgentStatusCode = {
  PENDING: 1101,
  ACTIVE: 1102,
  DISABLED: 1103,
  REVOKED: 1104,
} as const;

export const HwDeviceTypeCode = {
  BARCODE_PRINTER: 1111,
  RECEIPT_PRINTER: 1112,
} as const;

export const HwDeviceStatusCode = {
  ACTIVE: 1121,
  INACTIVE: 1122,
} as const;

export const HwPrintJobTypeCode = {
  LABEL_PRINT: 1131,
  RECEIPT_PRINT: 1132,
  OPEN_DRAWER: 1133,
  PRINTER_CALIBRATION: 1134,
} as const;

export const HwPrintJobStatusCode = {
  PENDING: 1141,
  SENT: 1142,
  PRINTING: 1143,
  COMPLETED: 1144,
  FAILED: 1145,
  CANCELLED: 1146,
} as const;

// Tipos para valores de diccionarios
export type HwAgentStatus = number | 'PENDING' | 'ACTIVE' | 'DISABLED' | 'REVOKED';
export type HwDeviceType = number | 'BARCODE_PRINTER' | 'RECEIPT_PRINTER';
export type HwDeviceStatus = number | 'ACTIVE' | 'INACTIVE';
export type HwPrintJobType = number | 'LABEL_PRINT' | 'RECEIPT_PRINT' | 'OPEN_DRAWER' | 'PRINTER_CALIBRATION';
export type HwPrintJobStatus = number | 'PENDING' | 'SENT' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// --- AGENTS DTOs ---

export interface CreateHwAgentRequest {
  name: string;
  branchId?: string;
}

export interface AuthorizeAgentRequest {
  pairingCode: string;
  name: string;
  branchId?: string;
}

export interface UpdateHwAgentRequest {
  name: string;
  status: HwAgentStatus;
}

export interface HwAgentResponse {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  agentUuid: string | null;
  machineName: string | null;
  status: number | string;
  pairingCode?: string | null;
  pairingExpiresAt?: string | null;
  lastSeen: string | null;
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageHwAgentResponse {
  content: HwAgentResponse[];
  pageable: PageableObject;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: SortObject;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// --- DEVICES DTOs ---

export interface CreateHwDeviceRequest {
  agentId: string;
  name: string;
  deviceType: HwDeviceType;
  ipAddress?: string;
  port?: number;
  isDefault?: boolean;
}

export interface UpdateHwDeviceRequest {
  name: string;
  deviceType: HwDeviceType;
  ipAddress?: string;
  port?: number;
  isDefault?: boolean;
  status: HwDeviceStatus;
}

export interface HwDeviceResponse {
  id: string;
  agentId: string;
  agentName: string;
  name: string;
  deviceType: number | string;
  ipAddress: string | null;
  port: number | null;
  isDefault: boolean;
  status: number | string;
  createdAt: string;
  updatedAt: string;
  reachable?: boolean | null;
  statusKnown?: boolean | null;
  ready?: boolean | null;
  readinessMessage?: string | null;
  lastCheckedAt?: string | null;
  calibrationSupported?: boolean | null;
  loadedRollSizeId?: string | null;
  loadedRollName?: string | null;
  calibrationJobId?: string | null;
  calibrationStatus?: number | string | null;
  lastCalibratedAt?: string | null;
  rollVerifiedAt?: string | null;
}

export interface PageHwDeviceResponse {
  content: HwDeviceResponse[];
  pageable: PageableObject;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: SortObject;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// --- PRINT JOBS DTOs ---

export interface LabelPrintItem {
  productId?: string;
  name: string;
  price?: number;
  barcode: string;
  barcodeType?: string;
  quantity: number;
}

export interface LabelPrintPayload {
  width: number;
  height: number;
  gap?: number;
  items: LabelPrintItem[];
}

export interface ReceiptPrintItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptPrintPayload {
  saleId?: string;
  invoiceNumber?: string;
  customer?: string;
  items?: ReceiptPrintItem[];
  total?: number;
  openDrawer?: boolean;
}

export interface OpenDrawerPayload {
  reason?: string;
}

export interface CreatePrintJobRequest {
  deviceId?: string | null;
  jobType: HwPrintJobType;
  payload: Record<string, unknown> | LabelPrintPayload | ReceiptPrintPayload | OpenDrawerPayload;
}

export interface HwPrintJobResponse {
  id: string;
  branchId: string;
  agentId: string;
  agentName: string;
  deviceId: string | null;
  deviceName: string | null;
  requestedByEmployeeId: string;
  requestedByEmployeeName: string;
  jobType: number | string;
  status: number | string;
  payload: Record<string, unknown> | string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageHwPrintJobResponse {
  content: HwPrintJobResponse[];
  pageable: PageableObject;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: SortObject;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
