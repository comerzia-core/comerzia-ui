// src/features/employees/services/invitationService.ts
import api from '../../../lib/axios';
import type { PageResponse } from '../../../types/api';
import type {
  TenantEmployeeInvitationResponse,
  CreateTenantInvitationRequest,
  InspectInvitationResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse
} from '../types/invitation';

export const invitationService = {
  /**
   * Obtiene el listado paginado de invitaciones de la empresa autenticada.
   */
  async listInvitations(page = 0, size = 10): Promise<PageResponse<TenantEmployeeInvitationResponse>> {
    const response = await api.get<PageResponse<TenantEmployeeInvitationResponse>>(
      `/tenant/employee-invitations?page=${page}&size=${size}`
    );
    return response.data;
  },

  /**
   * Emite una nueva invitación para un colaborador.
   */
  async createInvitation(data: CreateTenantInvitationRequest): Promise<TenantEmployeeInvitationResponse> {
    const response = await api.post<TenantEmployeeInvitationResponse>(
      '/tenant/employee-invitations',
      data
    );
    return response.data;
  },

  /**
   * Reenvía una invitación pendiente (sujeto a cooldown de 60s).
   */
  async resendInvitation(publicReference: string): Promise<TenantEmployeeInvitationResponse> {
    const response = await api.post<TenantEmployeeInvitationResponse>(
      `/tenant/employee-invitations/${publicReference}/resend`
    );
    return response.data;
  },

  /**
   * Revoca una invitación pendiente con motivo.
   */
  async revokeInvitation(publicReference: string, reason: string): Promise<TenantEmployeeInvitationResponse> {
    const response = await api.post<TenantEmployeeInvitationResponse>(
      `/tenant/employee-invitations/${publicReference}/revoke`,
      { reason }
    );
    return response.data;
  },

  /**
   * Inspección pública segura del token de invitación (solo lectura, no consume token).
   */
  async inspectInvitation(token: string, signal?: AbortSignal): Promise<InspectInvitationResponse> {
    const response = await api.post<InspectInvitationResponse>(
      '/public/employee-invitations/inspect',
      { token: token.trim() },
      { signal }
    );
    return response.data;
  },

  /**
   * Aceptación pública transaccional de la invitación (emite sesión y enrola al usuario).
   */
  async acceptInvitation(data: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
    const response = await api.post<AcceptInvitationResponse>(
      '/public/employee-invitations/accept',
      data
    );
    return response.data;
  }
};

