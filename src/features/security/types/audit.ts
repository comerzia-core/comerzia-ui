// src/features/security/types/audit.ts

export interface AuditLogResponse {
  id: number;
  userFullName: string;
  action: string;
  module: string;
  entity: string;
  ipAddress: string;
  userAgent: string;
  date: string;
  newValues: string;
}
