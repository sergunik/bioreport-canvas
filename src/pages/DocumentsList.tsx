import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileText, Plus } from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { documentService } from '@/api';
import type { DocumentJobStatus } from '@/types/api';
import { cn } from '@/lib/utils';
import DocumentUpload from './DocumentUpload';

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function statusVariant(
  status: DocumentJobStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'done':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function statusLabel(status: DocumentJobStatus, t: (key: string) => string): string {
  if (!status) {
    return t('documents.list.statusValue.unknown');
  }

  const knownStatuses: Set<NonNullable<DocumentJobStatus>> = new Set([
    'pending',
    'processing',
    'done',
    'failed',
  ]);
  if (!knownStatuses.has(status)) {
    return t('documents.list.statusValue.unknown');
  }

  return t(`documents.list.statusValue.${status}`);
}

function isClickableStatus(status: DocumentJobStatus): boolean {
  return status === 'done' || status === 'failed';
}

export default function DocumentsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.list(),
    refetchInterval: (query) => {
      const docs = query.state.data?.data ?? [];
      return docs.some((d) => d.job_status === 'pending' || d.job_status === 'processing') ? 5000 : false;
    },
  });

  const documents = data?.data ?? [];
  const isEmpty = !isLoading && !isError && documents.length === 0;

  if (isEmpty) {
    return <DocumentUpload />;
  }

  return (
    <MainLayout>
      <PageContainer size="xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('documents.list.title')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('documents.list.subtitle')}
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/documents/upload')}>
            <Plus className="h-4 w-4" />
            {t('documents.list.uploadFirst')}
          </Button>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">
                {error instanceof Error ? error.message : t('documents.list.errorLoad')}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && documents.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('documents.list.fileName')}</TableHead>
                  <TableHead>{t('documents.list.createdAt')}</TableHead>
                  <TableHead>{t('documents.list.fileSize')}</TableHead>
                  <TableHead>{t('documents.list.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc.uuid}
                    className={cn(
                      isClickableStatus(doc.job_status)
                        ? 'cursor-pointer hover:bg-muted/50'
                        : 'cursor-not-allowed opacity-60'
                    )}
                    onClick={() => {
                      if (!isClickableStatus(doc.job_status)) {
                        return;
                      }
                      navigate(`/documents/${doc.uuid}`);
                    }}
                    onKeyDown={(event) => {
                      if (!isClickableStatus(doc.job_status)) {
                        return;
                      }
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigate(`/documents/${doc.uuid}`);
                      }
                    }}
                    tabIndex={isClickableStatus(doc.job_status) ? 0 : -1}
                    aria-disabled={!isClickableStatus(doc.job_status)}
                  >
                    <TableCell className="font-mono text-sm">
                      {doc.uuid}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSize(doc.file_size_bytes)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(doc.job_status)}>
                        {statusLabel(doc.job_status, t)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

      </PageContainer>
    </MainLayout>
  );
}
