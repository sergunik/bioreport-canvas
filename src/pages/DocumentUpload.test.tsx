import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentUpload from '@/pages/DocumentUpload';

const mockNavigate = vi.fn();
const mockUpload = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/api', () => ({
  documentService: {
    upload: (...args: unknown[]) => mockUpload(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    status: number;
    constructor(message = 'Error', status = 500) {
      super(message);
      this.status = status;
    }
    isValidationError() {
      return this.status === 422;
    }
    getFirstError() {
      return this.message;
    }
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks non-pdf files on client validation', async () => {
    const { container } = renderWithProviders(<DocumentUpload />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const txtFile = new File(['abc'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [txtFile] } });

    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith('documents.upload.validationWrongType');
  });

  it('blocks files larger than 10MB', async () => {
    const { container } = renderWithProviders(<DocumentUpload />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith('documents.upload.validationTooLarge');
  });

  it('uploads valid pdf and redirects to documents list', async () => {
    mockUpload.mockResolvedValue({ uuid: 'doc-1' });
    const { container } = renderWithProviders(<DocumentUpload />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const pdfFile = new File(['pdf'], 'report.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(pdfFile);
      expect(mockToastSuccess).toHaveBeenCalledWith('documents.upload.success');
      expect(mockNavigate).toHaveBeenCalledWith('/documents', { replace: true });
    });
  });
});
