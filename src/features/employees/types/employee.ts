// src/features/employees/types/employee.ts

export interface PersonDetails {
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  documentType: number;
  documentNumber: string;
  extension?: number;
  phoneNumber?: string;
  email?: string;
}

export interface ContractDetails {
  branchId?: string | null;
  employmentStartDate: string; // ISO format date (YYYY-MM-DD) or UTC string
  paymentFrequency: number; // 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY'
  baseSalary?: number;
}

export interface CreateEmployeeRequest {
  person: PersonDetails;
  contract: ContractDetails;
}

export interface UpdateEmployeeRequest {
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  documentType: number;
  documentNumber: string;
  documentExtension?: number;
  phoneNumber?: string;
  email?: string;
  branchId?: string | null;
  employmentStartDate: string;
  employmentEndDate?: string | null;
  baseSalary?: number;
  paymentFrequency: number;
}

export interface EmployeeSummaryResponse {
  id: string;
  fullName: string;
  documentNumber: string;
  branchName: string;
  roleNames: string[];
  userEnabled: boolean;
  requiresPasswordChange: boolean;
}

export interface DictionaryResponse {
  code: number;
  label: string;
}

export interface EmployeeDetailResponse {
  id: string;
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  documentType: DictionaryResponse | null;
  documentNumber: string;
  documentExtension: DictionaryResponse | null;
  phoneNumber: string;
  email: string;
  branchId: string;
  branchName: string;
  employmentStartDate: string;
  employmentEndDate: string | null;
  baseSalary: number;
  paymentFrequency: DictionaryResponse | null;
  username: string;
  userEnabled: boolean;
  requiresPasswordChange: boolean;
  roleIds: string[];
  roleNames: string[];
}

export interface EmployeeCreatedResponse {
  id: string;
  fullName: string;
  documentNumber: string;
  branchName: string;
  username: string;
  temporaryPassword?: string;
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}
