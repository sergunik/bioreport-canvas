import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { MainLayout, PageContainer } from '@/components/layout';
import { PageBreadcrumbs } from '@/components/layout/PageBreadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { diagnosticReportService } from '@/api';
import { formatDate } from '@/lib/date';

function formatObservationValue(value: number | boolean | string): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

export default function DiagnosticReportDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportId = id != null ? Number(id) : NaN;

  const isValidId = id != null && Number.isInteger(reportId);
  const { data: report, isLoading, isError, error } = useQuery({
    queryKey: ['diagnostic-report', reportId],
    queryFn: () => diagnosticReportService.get(reportId),
    enabled: isValidId,
  });

  useEffect(() => {
    if (id != null && !Number.isInteger(reportId)) {
      navigate('/diagnostic-reports', { replace: true });
    }
  }, [id, reportId, navigate]);

  if (!isValidId) {
    return null;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <PageContainer size="xl">
          <div className="mb-4">
            <PageBreadcrumbs />
          </div>
          <p className="text-muted-foreground">Loading report...</p>
        </PageContainer>
      </MainLayout>
    );
  }

  if (isError || !report) {
    return (
      <MainLayout>
        <PageContainer size="xl">
          <div className="mb-4">
            <PageBreadcrumbs />
          </div>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-destructive">
                {error instanceof Error ? error.message : 'Report not found'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/diagnostic-reports')}
              >
                Back to list
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  const displayTitle = report.title ?? report.notes ?? `Report #${report.id}`;

  return (
    <MainLayout>
      <PageContainer size="xl">
        <div className="mb-4">
          <PageBreadcrumbs />
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{displayTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Created {formatDate(report.created_at, { pattern: 'datetime' })}
            {report.updated_at !== report.created_at &&
              ` · Updated ${formatDate(report.updated_at, { pattern: 'datetime' })}`}
          </p>
        </div>

        {report.notes && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Notes</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{report.notes}</p>
            </CardContent>
          </Card>
        )}

        {report.document_uuids && report.document_uuids.length > 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {t('diagnosticReports.detail.attachedDocuments')}
              </h2>
              <ul className="space-y-2">
                {report.document_uuids.map((uuid) => (
                  <li key={uuid} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Link
                      to={`/documents/${uuid}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <span className="w-2 h-2 rounded-full bg-primary/40" />
                      {uuid}.pdf
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Observations
            </h2>
            {report.observations.length === 0 ? (
              <p className="text-muted-foreground">No observations in this report.</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Biomarker</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Reference range</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.observations.map((obs) => {
                      const refRange =
                        obs.reference_range_min != null || obs.reference_range_max != null
                          ? [
                              obs.reference_range_min,
                              obs.reference_range_max,
                            ]
                              .filter((v) => v != null)
                              .join(' – ') +
                            (obs.reference_unit ? ` ${obs.reference_unit}` : '')
                          : '—';
                      return (
                        <TableRow key={obs.id}>
                          <TableCell className="font-medium">
                            {obs.biomarker_name}
                            {obs.biomarker_code && (
                              <span className="text-muted-foreground font-normal ml-1">
                                ({obs.biomarker_code})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{formatObservationValue(obs.value)}</TableCell>
                          <TableCell>{obs.unit || '—'}</TableCell>
                          <TableCell>{refRange}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
}
