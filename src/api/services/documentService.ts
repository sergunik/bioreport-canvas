import api from '@/api/client';
import type {
  DocumentListResponse,
  DocumentMetadataResource,
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

  getMetadata: async (uuid: string): Promise<DocumentMetadataResource> => {
    return api.get<DocumentMetadataResource>(`/documents/${uuid}/metadata`);
  },

  getPdf: async (uuid: string, signal?: AbortSignal): Promise<Blob> => {
    return api.getBlob(`/documents/${uuid}`, {
      headers: { Accept: 'application/pdf' },
      signal,
    });
  },

  delete: async (uuid: string): Promise<void> => {
    await api.delete<void>(`/documents/${uuid}`);
  },
};

export default documentService;
