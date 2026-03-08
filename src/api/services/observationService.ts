import api from '@/api/client';
import type {
  ObservationListResponse,
  ObservationResource,
  StoreObservationBatchRequest,
  StoreObservationRequest,
} from '@/types/api';

export const observationService = {
  getAll: async (): Promise<ObservationResource[]> => {
    const response = await api.get<ObservationListResponse>('/observations');
    return response.data;
  },

  create: async (
    diagnosticReportId: number,
    data: StoreObservationRequest
  ): Promise<ObservationResource> => {
    return api.post<ObservationResource>(
      `/diagnostic-reports/${diagnosticReportId}/observations`,
      data
    );
  },

  createBatch: async (
    diagnosticReportId: number,
    data: StoreObservationBatchRequest
  ): Promise<ObservationResource[]> => {
    return api.post<ObservationResource[]>(
      `/diagnostic-reports/${diagnosticReportId}/observations/batch`,
      data
    );
  },
};

export default observationService;
