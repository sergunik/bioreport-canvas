import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiClientError } from './client';

const originalFetch = globalThis.fetch;

describe('apiClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends requests with credentials include', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiClient('/test');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('does not set Authorization header', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiClient('/test');

    const callArgs = fetchMock.mock.calls[0][1];
    expect(callArgs.headers).not.toHaveProperty('Authorization');
  });

  it('retries request after successful token refresh on 401', async () => {
    const refreshResponse = new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    const successResponse = new Response(JSON.stringify({ data: 'success' }), { status: 200 });
    const unauthorizedResponse = new Response(JSON.stringify({ message: 'Unauthenticated' }), { status: 401 });

    fetchMock
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce(refreshResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await apiClient<{ data: string }>('/protected');

    expect(result.data).toBe('success');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
  });

  it('throws ApiClientError when refresh fails on 401', async () => {
    const unauthorizedResponse = new Response(JSON.stringify({ message: 'Unauthenticated' }), { status: 401 });
    const refreshFailResponse = new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });

    fetchMock
      .mockResolvedValueOnce(unauthorizedResponse)
      .mockResolvedValueOnce(refreshFailResponse);

    const error = await apiClient('/protected').catch(e => e) as ApiClientError;
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.status).toBe(401);
  });

  it('throws ApiClientError on non-401 error responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }),
    );

    await expect(apiClient('/missing')).rejects.toThrow(ApiClientError);
  });

  it('returns empty object for 204 responses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiClient('/delete');
    expect(result).toEqual({});
  });
});
