import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  FlaskConical,
  User,
  Users,
  Activity,
  FileText,
  FileUp,
  LineChart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { documentService } from '@/api';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  comingSoon?: boolean;
  primary?: boolean;
}

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  comingSoon = false,
  primary = false,
}: QuickActionCardProps) {
  const isClickable = !comingSoon && Boolean(onClick);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isClickable || !onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300',
        comingSoon
          ? 'cursor-default opacity-60'
          : 'hover:border-primary/30 hover:shadow-soft-lg',
        primary && !comingSoon && 'border-primary/20 bg-primary/5'
      )}
      onClick={comingSoon ? undefined : onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="flex items-start gap-4 p-5">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors',
            primary
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary'
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {comingSoon && (
              <Badge variant="secondary" className="text-xs">
                Coming Soon
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {!comingSoon && (
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  onClick?: () => void;
}

function StatCard({ label, value, icon, onClick }: StatCardProps) {
  const isClickable = Boolean(onClick);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const content = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </>
  );
  return (
    <Card
      className={isClickable ? 'cursor-pointer transition-colors hover:bg-muted/50' : undefined}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <CardContent className="flex items-center gap-4 p-5">
        {content}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { account, hasCompletedSetup } = useAuth();
  const { data: documentsData } = useQuery({
    queryKey: ['documents'],
    queryFn: () => documentService.list(),
  });

  const displayName = account?.nickname || 'there';
  const documentCount = documentsData?.data?.length ?? 0;

  return (
    <MainLayout>
      <PageContainer size="xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.welcome')}, {displayName}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('dashboard.emptyState.description')}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Empty State Hero */}
            <Card className="border-dashed border-2 bg-gradient-to-br from-secondary/30 to-background">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mt-6 text-xl font-semibold text-foreground">
                  {t('dashboard.emptyState.title')}
                </h2>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  {t('dashboard.emptyState.description')}
                </p>
                <Button className="mt-6 gap-2" onClick={() => navigate('/diagnostic-reports/new')}>
                  <FlaskConical className="h-4 w-4" />
                  {t('dashboard.quickActions.createReport.title')}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                {t('dashboard.quickActions.title')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <QuickActionCard
                  title={t('dashboard.quickActions.createReport.title')}
                  description={t('dashboard.quickActions.createReport.description')}
                  icon={<FlaskConical className="h-5 w-5" />}
                  onClick={() => navigate('/diagnostic-reports/new')}
                  primary
                />
                <QuickActionCard
                  title={t('dashboard.quickActions.viewReports.title')}
                  description={t('dashboard.quickActions.viewReports.description')}
                  icon={<FileText className="h-5 w-5" />}
                  onClick={() => navigate('/diagnostic-reports')}
                />
                <QuickActionCard
                  title={t('dashboard.quickActions.uploadDocument.title')}
                  description={t('dashboard.quickActions.uploadDocument.description')}
                  icon={<FileUp className="h-5 w-5" />}
                  onClick={() => navigate('/documents/upload')}
                />
                {!hasCompletedSetup && (
                  <QuickActionCard
                    title={t('dashboard.quickActions.completeProfile.title')}
                    description={t('dashboard.quickActions.completeProfile.description')}
                    icon={<User className="h-5 w-5" />}
                    onClick={() => navigate('/settings/profile')}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            <StatCard
              label={t('dashboard.stats.observations')}
              value={t('dashboard.stats.view')}
              icon={<LineChart className="h-5 w-5" />}
              onClick={() => navigate('/biomarkers')}
            />
            <StatCard
              label={t('dashboard.stats.totalUploadedDocuments')}
              value={documentCount}
              icon={<FileText className="h-5 w-5" />}
              onClick={() => navigate('/documents')}
            />
            <StatCard
              label={t('dashboard.stats.familyMembers')}
              value={1}
              icon={<Users className="h-5 w-5" />}
            />
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
