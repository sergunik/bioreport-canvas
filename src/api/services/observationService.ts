import api from '@/api/client';
import type {
  ObservationResource,
  StoreObservationBatchRequest,
  StoreObservationRequest,
} from '@/types/api';

export const observationService = {
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
