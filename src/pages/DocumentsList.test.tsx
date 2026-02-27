import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import DocumentsList from './DocumentsList';

const mockNavigate = vi.fn();
const mockList = vi.fn();

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

vi.mock('@/api', () => ({
  documentService: {
    list: (...args: unknown[]) => mockList(...args),
  },
}));

vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DocumentsList />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DocumentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders status fallback for unknown status values', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          uuid: 'doc-a',
          file_size_bytes: 1024,
          mime_type: 'application/pdf',
          processed_at: null,
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: '2025-01-01T00:00:00.000Z',
          job_status: 'pending',
        },
        {
          uuid: 'doc-b',
          file_size_bytes: 2048,
          mime_type: 'application/pdf',
          processed_at: null,
          created_at: '2025-01-02T00:00:00.000Z',
          updated_at: '2025-01-02T00:00:00.000Z',
          job_status: 'unexpected',
        },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('doc-a')).toBeInTheDocument();
    });

    expect(screen.getByText('documents.list.statusValue.pending')).toBeInTheDocument();
    expect(screen.getByText('documents.list.statusValue.unknown')).toBeInTheDocument();
  });

  it('navigates to upload page from empty state action', async () => {
    mockList.mockResolvedValue({ data: [] });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('documents.list.emptyTitle')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('documents.list.uploadFirst'));
    expect(mockNavigate).toHaveBeenCalledWith('/documents/upload');
  });
});
