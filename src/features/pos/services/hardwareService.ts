import api from '../../../lib/axios';
import type {
  CreateHwAgentRequest,
  AuthorizeAgentRequest,
  UpdateHwAgentRequest,
  HwAgentResponse,
  PageHwAgentResponse,
  CreateHwDeviceRequest,
  UpdateHwDeviceRequest,
  HwDeviceResponse,
  PageHwDeviceResponse,
  CreatePrintJobRequest,
  HwPrintJobResponse,
  PageHwPrintJobResponse,
  HwAgentStatus,
  HwDeviceType,
  HwDeviceStatus,
  HwPrintJobStatus,
} from '../types/hardware';

export const hardwareService = {
  // ==========================================
  // AGENTES / TERMINALES HARDWARE
  // ==========================================

  createAgent: async (data: CreateHwAgentRequest): Promise<HwAgentResponse> => {
    const response = await api.post<HwAgentResponse>('/tenant/hardware/agents', data);
    return response.data;
  },

  regenerateAgentCode: async (id: string): Promise<HwAgentResponse> => {
    const response = await api.post<HwAgentResponse>(`/tenant/hardware/agents/${id}/regenerate-code`);
    return response.data;
  },

  authorizeAgent: async (data: AuthorizeAgentRequest): Promise<HwAgentResponse> => {
    const response = await api.post<HwAgentResponse>('/tenant/hardware/agents/authorize', data);
    return response.data;
  },

  updateAgent: async (id: string, data: UpdateHwAgentRequest): Promise<HwAgentResponse> => {
    const response = await api.put<HwAgentResponse>(`/tenant/hardware/agents/${id}`, data);
    return response.data;
  },

  getAgentById: async (id: string): Promise<HwAgentResponse> => {
    const response = await api.get<HwAgentResponse>(`/tenant/hardware/agents/${id}`);
    return response.data;
  },

  getAgents: async (
    branchId?: string,
    status?: HwAgentStatus,
    page: number = 0,
    size: number = 20,
    sort: string[] = ['updatedAt,desc']
  ): Promise<PageHwAgentResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sort && sort.length > 0) {
      sort.forEach(s => params.append('sort', s));
    }
    if (branchId) {
      params.append('branchId', branchId);
    }
    if (status !== undefined && status !== null && String(status) !== '') {
      params.append('status', status.toString());
    }

    const response = await api.get<PageHwAgentResponse>('/tenant/hardware/agents', { params });
    return response.data;
  },

  deleteAgent: async (id: string): Promise<void> => {
    await api.delete(`/tenant/hardware/agents/${id}`);
  },

  // ==========================================
  // DISPOSITIVOS / IMPRESORAS
  // ==========================================

  createDevice: async (data: CreateHwDeviceRequest): Promise<HwDeviceResponse> => {
    const response = await api.post<HwDeviceResponse>('/tenant/hardware/devices', data);
    return response.data;
  },

  updateDevice: async (id: string, data: UpdateHwDeviceRequest): Promise<HwDeviceResponse> => {
    const response = await api.put<HwDeviceResponse>(`/tenant/hardware/devices/${id}`, data);
    return response.data;
  },

  getDeviceById: async (id: string): Promise<HwDeviceResponse> => {
    const response = await api.get<HwDeviceResponse>(`/tenant/hardware/devices/${id}`);
    return response.data;
  },

  getDevices: async (
    agentId?: string,
    deviceType?: HwDeviceType,
    status?: HwDeviceStatus,
    page: number = 0,
    size: number = 20,
    sort: string[] = ['name,asc']
  ): Promise<PageHwDeviceResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sort && sort.length > 0) {
      sort.forEach(s => params.append('sort', s));
    }
    if (agentId) {
      params.append('agentId', agentId);
    }
    if (deviceType !== undefined && deviceType !== null && String(deviceType) !== '') {
      params.append('deviceType', deviceType.toString());
    }
    if (status !== undefined && status !== null && String(status) !== '') {
      params.append('status', status.toString());
    }

    const response = await api.get<PageHwDeviceResponse>('/tenant/hardware/devices', { params });
    return response.data;
  },

  deleteDevice: async (id: string): Promise<void> => {
    await api.delete(`/tenant/hardware/devices/${id}`);
  },

  // ==========================================
  // COLA Y TRABAJOS DE IMPRESIÓN (PRINT JOBS)
  // ==========================================

  calibrateRoll: async (deviceId: string, rollSizeId: string): Promise<HwPrintJobResponse> =>
    (await api.post<HwPrintJobResponse>(`/tenant/hardware/devices/${deviceId}/calibrations`, { rollSizeId })).data,

  confirmRoll: async (deviceId: string, jobId: string): Promise<HwDeviceResponse> =>
    (await api.post<HwDeviceResponse>(`/tenant/hardware/devices/${deviceId}/calibrations/${jobId}/confirmation`, { feedAligned: true })).data,

  createPrintJob: async (data: CreatePrintJobRequest): Promise<HwPrintJobResponse> => {
    const response = await api.post<HwPrintJobResponse>('/tenant/hardware/print-jobs', data);
    return response.data;
  },

  getPrintJobById: async (id: string): Promise<HwPrintJobResponse> => {
    const response = await api.get<HwPrintJobResponse>(`/tenant/hardware/print-jobs/${id}`);
    return response.data;
  },

  getPrintJobs: async (
    agentId?: string,
    deviceId?: string,
    status?: HwPrintJobStatus,
    page: number = 0,
    size: number = 20,
    sort: string[] = ['createdAt,desc']
  ): Promise<PageHwPrintJobResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (sort && sort.length > 0) {
      sort.forEach(s => params.append('sort', s));
    }
    if (agentId) {
      params.append('agentId', agentId);
    }
    if (deviceId) {
      params.append('deviceId', deviceId);
    }
    if (status !== undefined && status !== null && String(status) !== '') {
      params.append('status', status.toString());
    }

    const response = await api.get<PageHwPrintJobResponse>('/tenant/hardware/print-jobs', { params });
    return response.data;
  },

  cancelPrintJob: async (id: string): Promise<void> => {
    await api.post(`/tenant/hardware/print-jobs/${id}/cancel`);
  },
};
