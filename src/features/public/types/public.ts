export interface PublicPlan {
  code: number;
  name: string;
  monthlyPrice: number;
  currency: string;
  maxBranches: number;
  maxUsers: number;
  maxProducts: number;
  registrationAvailable: boolean;
}
export interface RegistrationOptions {
  roles: string[];
  branchCode: string;
  cashRegisterCode: string;
  cashRegisterName: string;
}
export interface RegistrationForm {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  email: string;
  username: string;
  password: string;
  commercialName: string;
  branchName: string;
}
export interface PublicApiError { code?: string; details?: { field: string; message: string }[] }
