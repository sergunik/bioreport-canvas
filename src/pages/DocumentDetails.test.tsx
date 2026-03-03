import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import DocumentDetails from '@/pages/DocumentDetails';

const mockNavigate = vi.fn();
const mockGetMetadata = vi.fn();
const mockDeleteDocument = vi.fn();
const mockCreateReport = vi.fn();
const mockCreateObservation = vi.fn();
const mockToast = vi.fn();

let routeUuid = 'doc-1';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ uuid: routeUuid }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: (...args: unknown[]) => mockToast(...args),
  }),
}));

vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/api', () => ({
  documentService: {
    getMetadata: (...args: unknown[]) => mockGetMetadata(...args),
    delete: (...args: unknown[]) => mockDeleteDocument(...args),
  },
  diagnosticReportService: {
    create: (...args: unknown[]) => mockCreateReport(...args),
  },
  observationService: {
    create: (...args: unknown[]) => mockCreateObservation(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    getFirstError() {
      return this.message;
    }
  },
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DocumentDetails />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DocumentDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeUuid = 'doc-1';
  });

  it('renders failed state with error message', async () => {
    mockGetMetadata.mockResolvedValue({
      uuid: 'doc-1',
      file_size_bytes: 1024,
      mime_type: 'application/pdf',
      processed_at: null,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
      status: 'failed',
      error_message: 'Unable to parse document',
      job_status: 'failed',
      parsed_result: null,
      anonymised_result: null,
      anonymised_artifacts: null,
      normalized_result: null,
      transliteration_mapping: null,
      final_result: null,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Unable to parse document')).toBeInTheDocument();
    });
    expect(screen.queryByText('documents.details.formTitle')).not.toBeInTheDocument();
  });

  it('renders done state with prefilled marker rows', async () => {
    mockGetMetadata.mockResolvedValue({
      uuid: 'doc-1',
      file_size_bytes: 1024,
      mime_type: 'application/pdf',
      processed_at: '2025-01-01T00:00:00.000Z',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
      status: 'done',
      error_message: null,
      job_status: 'done',
      parsed_result: null,
      anonymised_result: null,
      anonymised_artifacts: null,
      normalized_result: null,
      transliteration_mapping: null,
      final_result: {
        person: { name: 'User Name', dob: null },
        diagnostic_date: '2024-11-13',
        language: 'en',
        pii: [],
        markers: [
          {
            code: '123',
            name: 'Marker 1',
            value: {
              type: 'numeric',
              number: 14.2,
              unit: 'g/L',
              value: null,
              text: null,
            },
            reference_range: {
              min: 12,
              max: 16,
              unit: 'g/L',
            },
          },
        ],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Marker 1')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Document doc-1 - 2024-11-13')).toBeInTheDocument();
    expect(screen.getByText('documents.details.numericOnlyNotice')).toBeInTheDocument();
  });

  it('deletes document after confirmation and redirects to list', async () => {
    mockGetMetadata.mockResolvedValue({
      uuid: 'doc-1',
      file_size_bytes: 1024,
      mime_type: 'application/pdf',
      processed_at: null,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
      status: 'failed',
      error_message: 'Error',
      job_status: 'failed',
      parsed_result: null,
      anonymised_result: null,
      anonymised_artifacts: null,
      normalized_result: null,
      transliteration_mapping: null,
      final_result: null,
    });
    mockDeleteDocument.mockResolvedValue(undefined);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('documents.details.delete')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('documents.details.delete'));
    await waitFor(() => {
      expect(screen.getAllByText('documents.details.delete').length).toBeGreaterThan(1);
    });
    fireEvent.click(screen.getAllByText('documents.details.delete')[1]);

    await waitFor(() => {
      expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/documents', { replace: true });
  });
});
