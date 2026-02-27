import api from '@/api/client';
import type {
  DocumentListResponse,
  DocumentStoreResponse,
} from '@/types/api';

export const documentService = {
  list: async (): Promise<DocumentListResponse> => {
    return api.get<DocumentListResponse>('/documents');
  },

  upload: async (file: File): Promise<DocumentStoreResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.postForm<DocumentStoreResponse>('/documents', formData);
  },
};

export default documentService;
