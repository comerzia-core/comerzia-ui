import { isAxiosError } from 'axios';

interface OperationError {
  errorCode?: string;
  code?: string;
}

const messages: Record<string, string> = {
  return_shift_unavailable: 'Abre un turno en la tienda de la venta o solicita su reapertura.',
  return_shift_required: 'Selecciona un turno abierto para devolver.',
  shift_branch_mismatch: 'La caja debe pertenecer a la tienda de la venta.',
  shift_cashier_branch_mismatch: 'El cajero no pertenece a esta tienda.',
  shift_not_open: 'El turno ya está cerrado. Actualiza e intenta nuevamente.',
  shift_already_open: 'La caja o el cajero ya tiene un turno abierto.',
  observation_required: 'Indica el motivo del descuadre.',
  cash_register_not_active: 'La caja está deshabilitada.',
  shift_reopen_not_allowed: 'Solo puedes reabrir el último turno cerrado de hoy, sin otro turno abierto.',
  sale_not_returnable: 'Esta venta ya no permite devoluciones.',
  sale_not_pending: 'La venta ya no está pendiente de cobro.',
  insufficient_payment: 'El pago no cubre el total.',
  bad_request: 'Revisa los datos y montos ingresados.',
  invalid_return_quantity: 'Revisa las cantidades a devolver.',
  invalid_quantity: 'Revisa las cantidades a devolver.',
  resource_not_found: 'El registro ya no está disponible.',
  access_denied: 'No tienes permiso para esta operación.',
  validation_error: 'Revisa los datos ingresados.',
};

export const getPosErrorCode = (error: unknown): string | undefined => {
  if (!isAxiosError<OperationError>(error)) return undefined;
  return error.response?.data?.errorCode ?? error.response?.data?.code;
};

export const getPosOperationMessage = (error: unknown, fallback: string): string => {
  const code = getPosErrorCode(error);
  return (code && messages[code]) || fallback;
};
