// src/features/organization/types/branch.ts

export interface BranchResponse {
  id: string; // ID Hasheado
  name: string;
  address: string;
  code: string;
  status: boolean;
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  code: string;
}

export interface UpdateBranchRequest {
  name: string;
  address: string;
  status: boolean;
}