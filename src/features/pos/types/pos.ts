export interface DictionaryResponse {
  code: number;
  label: string;
}

export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PageableObject {
  offset: number;
  sort: SortObject;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

// Empleado (Cajero)
export interface EmployeePosResponse {
  id: string;
  fullName: string;
}

// Cajas Registradoras
export interface CashRegisterResponse {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  status: boolean;
  hasActiveShift: boolean;
}

export interface PageCashRegisterResponse {
  content: CashRegisterResponse[];
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

export interface CreateCashRegisterRequest {
  branchId: string;
  name: string;
  status: boolean;
}

export interface UpdateCashRegisterRequest {
  name: string;
  status: boolean;
}

// Turnos
export interface ShiftResponse {
  id: string;
  openedAt: string;
  closedAt: string | null;
  observation: string | null;
  statusType: DictionaryResponse;
  cashierName: string;
}

export interface PageShiftResponse {
  content: ShiftResponse[];
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

export interface ShiftPaymentSummaryResponse {
  paymentType: DictionaryResponse;
  salesAmount: number;
  inflowsAmount: number;
  outflowsAmount: number;
  returnsAmount: number;
  expectedAmount: number;
}

export interface ShiftSummaryResponse {
  id: string;
  cashName: string;
  branchName: string;
  openedAt: string;
  totalInflows: number;
  totalOutflows: number;
  employeeName: string;
  payments?: ShiftPaymentSummaryResponse[];
}

export interface OpenShiftRequest {
  cashRegisterId: string;
  initialAmount: number;
  cashierEmployeeId?: string;
  observation?: string;
}

export interface ShiftDetailCountRequest {
  paymentType: number;
  countedAmount: number;
}

export interface CloseShiftRequest {
  details: ShiftDetailCountRequest[];
  observation?: string;
}

export interface ShiftPaymentReport {
  paymentType: DictionaryResponse;
  salesAmount: number;
  returnsAmount: number;
  expectedAmount: number;
  countedAmount: number;
  differenceAmount: number;
}

export interface ShiftCompleteReportResponse {
  shiftId: string;
  cashRegisterName: string;
  branchName: string;
  cashierName: string;
  closedByName: string | null;
  openedAt: string;
  closedAt: string | null;
  statusType: DictionaryResponse;
  observation: string | null;
  initialAmount: number;
  totalInflows: number;
  totalOutflows: number;
  paymentReports: ShiftPaymentReport[];
}

// Movimientos
export interface MovementResponse {
  id: string;
  amount: number;
  date: string;
  movementType: DictionaryResponse;
  paymentType: DictionaryResponse;
  observation: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  cashRegisterName: string;
  branchName: string;
}

export interface PageMovementResponse {
  content: MovementResponse[];
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

export interface CreateMovementRequest {
  shiftId: string;
  movementType: number;
  paymentType: number;
  amount: number;
  observation?: string;
}

export interface UpdateMovementRequest {
  movementType: number;
  paymentType: number;
  amount: number;
  observation?: string;
}
