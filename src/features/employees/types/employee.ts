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
  branchId: number;
  employmentStartDate: string; // ISO format date (YYYY-MM-DD) or UTC string
  paymentFrequency: number; // 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY'
  baseSalary?: number;
}

export interface AccessDetails {
  roleIds: number[];
}

export interface CreateEmployeeRequest {
  person: PersonDetails;
  contract: ContractDetails;
  access: AccessDetails;
}

export interface UpdateEmployeeRequest {
  phoneNumber?: string;
  email?: string;
  branchId: number;
  baseSalary?: number;
  paymentFrequency: number;
  roleIds: number[];
  userEnabled: boolean;
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

export interface EmployeeDetailResponse {
  id: string;
  firstName: string;
  paternalSurname?: string;
  maternalSurname?: string;
  documentType: number;
  documentNumber: string;
  documentExtension?: number;
  phoneNumber?: string;
  email?: string;
  branchId: number;
  branchName?: string;
  employmentStartDate: string;
  employmentEndDate?: string;
  baseSalary?: number;
  paymentFrequency: number;
  username?: string;
  userEnabled: boolean;
  requiresPasswordChange: boolean;
  roleIds: number[];
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
