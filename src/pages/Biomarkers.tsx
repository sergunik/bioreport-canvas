import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MainLayout, PageContainer } from '@/components/layout';
import { PageBreadcrumbs } from '@/components/layout/PageBreadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { observationService } from '@/api';
import { groupObservationsByBiomarkerCode } from '@/lib/observations';
import { BiomarkerCard } from '@/components/biomarkers/BiomarkerCard';
import { ApiClientError } from '@/api/client';

const PER_PAGE = 10;

export default function Biomarkers() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['observations'],
    queryFn: () => observationService.getAll(),
  });

  const { groups, codes, totalPages, pageCodes, safePage } = useMemo(() => {
    const groups = data ? groupObservationsByBiomarkerCode(data) : {};
    const codes = Object.keys(groups);
    const totalPages = Math.max(1, Math.ceil(codes.length / PER_PAGE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * PER_PAGE;
    const pageCodes = codes.slice(start, start + PER_PAGE);
    return { groups, codes, totalPages, pageCodes, safePage };
  }, [data, page]);

  const currentPage = safePage;

  return (
    <MainLayout>
      <PageContainer size="xl">
        <div className="mb-4">
          <PageBreadcrumbs />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-8">{t('biomarkers.title')}</h1>

        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">{t('biomarkers.loading')}</p>
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <p className="text-destructive">
                {error instanceof ApiClientError ? error.message : t('biomarkers.errorLoad')}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && codes.length > 0 && (
          <>
            <div className="space-y-6">
              {pageCodes.map((code) => (
                <BiomarkerCard key={code} observations={groups[code]} />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.max(1, p - 1));
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                      aria-disabled={currentPage <= 1}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4 py-2 text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      aria-disabled={currentPage >= totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}

        {!isLoading && !isError && codes.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">{t('biomarkers.empty')}</p>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </MainLayout>
  );
}
