import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FlaskConical, Plus, FileText } from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DiagnosticReportsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

        {/* Empty State */}
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-foreground">
              No reports yet
            </h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Create your first diagnostic report to start tracking your health observations.
            </p>
            <Button className="mt-6 gap-2" onClick={() => navigate('/diagnostic-reports/new')}>
              <FlaskConical className="h-4 w-4" />
              Create Diagnostic Report
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
}
