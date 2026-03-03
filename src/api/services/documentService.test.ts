import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPostForm, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPostForm: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  default: {
    get: (endpoint: string, options?: RequestInit) => mockGet(endpoint, options),
    postForm: (endpoint: string, formData: FormData, options?: RequestInit) =>
      mockPostForm(endpoint, formData, options),
    delete: (endpoint: string, options?: RequestInit) => mockDelete(endpoint, options),
  },
}));

import { documentService } from '@/api/services/documentService';

describe('documentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('calls GET /documents and returns data', async () => {
      const response = { data: [{ uuid: 'a', file_size_bytes: 1024, mime_type: 'application/pdf', processed_at: null, created_at: '', updated_at: '', job_status: 'pending' }] };
      mockGet.mockResolvedValue(response);

      const result = await documentService.list();

      expect(mockGet).toHaveBeenCalledWith('/documents', undefined);
      expect(result).toEqual(response);
    });
  });

  describe('upload', () => {
    it('appends file to FormData and calls POST /documents', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const response = { uuid: 'new-uuid' };
      mockPostForm.mockResolvedValue(response);

      const result = await documentService.upload(file);

      expect(mockPostForm).toHaveBeenCalledWith('/documents', expect.any(FormData), undefined);
      const formData = mockPostForm.mock.calls[0][1] as FormData;
      expect(formData.get('file')).toBe(file);
      expect(result).toEqual(response);
    });
  });

  describe('getMetadata', () => {
    it('calls GET /documents/{uuid}/metadata and returns data', async () => {
      const response = {
        uuid: 'doc-uuid',
        file_size_bytes: 1024,
        mime_type: 'application/pdf',
        processed_at: null,
        created_at: '',
        updated_at: '',
        status: 'done',
        error_message: null,
        job_status: 'done',
        parsed_result: null,
        anonymised_result: null,
        anonymised_artifacts: null,
        normalized_result: null,
        transliteration_mapping: null,
        final_result: null,
      };
      mockGet.mockResolvedValue(response);

      const result = await documentService.getMetadata('doc-uuid');

      expect(mockGet).toHaveBeenCalledWith('/documents/doc-uuid/metadata', undefined);
      expect(result).toEqual(response);
    });
  });

  describe('delete', () => {
    it('calls DELETE /documents/{uuid}', async () => {
      mockDelete.mockResolvedValue({});

      await documentService.delete('doc-uuid');

      expect(mockDelete).toHaveBeenCalledWith('/documents/doc-uuid', undefined);
    });
  });
});
