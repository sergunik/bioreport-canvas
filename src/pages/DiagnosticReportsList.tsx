import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, Plus, FileText, ChevronRight } from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { diagnosticReportService } from '@/api';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function DiagnosticReportsList() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['diagnostic-reports'],
    queryFn: () => diagnosticReportService.list(),
  });

  const reports = data?.data ?? [];
  const isEmpty = !isLoading && !isError && reports.length === 0;

  return (
    <MainLayout>
      <PageContainer size="xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Diagnostic Reports</h1>
            <p className="mt-2 text-muted-foreground">
              View and manage your diagnostic reports
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/diagnostic-reports/new')}>
            <Plus className="h-4 w-4" />
            New Report
          </Button>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">Loading reports...</p>
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">
                {error instanceof Error ? error.message : 'Failed to load reports'}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report) => {
              const displayTitle =
                report.title ?? report.notes ?? `Report #${report.id}`;
              return (
                <Card
                  key={report.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/diagnostic-reports/${report.id}`)}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {displayTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatDate(report.created_at)}
                        {report.observations.length > 0 && (
                          <span className="ml-2">
                            · {report.observations.length} observation
                            {report.observations.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {isEmpty && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-foreground">
                No reports yet
              </h2>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Create your first diagnostic report to start tracking your health
                observations.
              </p>
              <Button
                className="mt-6 gap-2"
                onClick={() => navigate('/diagnostic-reports/new')}
              >
                <FlaskConical className="h-4 w-4" />
                Create Diagnostic Report
              </Button>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </MainLayout>
  );
}
