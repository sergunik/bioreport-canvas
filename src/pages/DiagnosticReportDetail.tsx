import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
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

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function DiagnosticReportDetail() {
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
        <PageContainer size="lg">
          <p className="text-muted-foreground">Loading report...</p>
        </PageContainer>
      </MainLayout>
    );
  }

  if (isError || !report) {
    return (
      <MainLayout>
        <PageContainer size="lg">
          <Button
            variant="ghost"
            className="mb-4 gap-2 text-muted-foreground"
            onClick={() => navigate('/diagnostic-reports')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
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
      <PageContainer size="lg">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 gap-2 text-muted-foreground"
            onClick={() => navigate('/diagnostic-reports')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{displayTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Created {formatDate(report.created_at)}
            {report.updated_at !== report.created_at &&
              ` · Updated ${formatDate(report.updated_at)}`}
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
                          <TableCell>{obs.value}</TableCell>
                          <TableCell>{obs.unit}</TableCell>
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
