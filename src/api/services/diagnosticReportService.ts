import api from '../client';
import type {
  DiagnosticReportResource,
  DiagnosticReportListResponse,
  StoreDiagnosticReportRequest,
} from '@/types/api';

export const diagnosticReportService = {
  list: async (): Promise<DiagnosticReportListResponse> => {
    return api.get<DiagnosticReportListResponse>('/diagnostic-reports');
  },

  get: async (id: number): Promise<DiagnosticReportResource> => {
    return api.get<DiagnosticReportResource>(`/diagnostic-reports/${id}`);
  },

  create: async (
    data: StoreDiagnosticReportRequest
  ): Promise<DiagnosticReportResource> => {
    return api.post<DiagnosticReportResource>('/diagnostic-reports', data);
  },
};

export default diagnosticReportService;
