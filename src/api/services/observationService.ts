import api from '../client';
import type { ObservationResource, StoreObservationRequest } from '@/types/api';

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
};

export default observationService;
