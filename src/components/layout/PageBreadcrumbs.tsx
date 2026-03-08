import { Fragment } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const PROTECTED_ROOT_SEGMENTS = new Set([
  'dashboard',
  'diagnostic-reports',
  'documents',
  'settings',
  'biomarkers',
]);

type BreadcrumbEntry = {
  label: string;
  to: string;
  isCurrentPage: boolean;
};

function getPathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

function shouldRenderBreadcrumbs(pathname: string): boolean {
  const [rootSegment] = getPathSegments(pathname);

  return Boolean(rootSegment && rootSegment !== 'dashboard' && PROTECTED_ROOT_SEGMENTS.has(rootSegment));
}

function getSegmentLabel(
  segment: string,
  previousSegment: string | undefined,
  t: TFunction
): string {
  if (previousSegment === 'diagnostic-reports' && /^\d+$/.test(segment)) {
    return t('breadcrumbs.report', { id: segment });
  }

  if (previousSegment === 'documents') {
    return t('breadcrumbs.document');
  }

  return t(`breadcrumbs.${segment}`, { defaultValue: segment });
}

function buildBreadcrumbs(pathname: string, t: TFunction): BreadcrumbEntry[] {
  const segments = getPathSegments(pathname).filter((segment) => segment !== 'dashboard');

  return [
    {
      label: t('breadcrumbs.dashboard'),
      to: '/dashboard',
      isCurrentPage: false,
    },
    ...segments.map((segment, index) => ({
      label: getSegmentLabel(segment, segments[index - 1], t),
      to: `/${segments.slice(0, index + 1).join('/')}`,
      isCurrentPage: index === segments.length - 1,
    })),
  ];
}

export function PageBreadcrumbs() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  if (!shouldRenderBreadcrumbs(pathname)) {
    return null;
  }

  const breadcrumbs = buildBreadcrumbs(pathname, t);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb.to}>
            <BreadcrumbItem>
              {breadcrumb.isCurrentPage ? (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  asChild
                  className="text-muted-foreground hover:text-muted-foreground hover:underline"
                >
                  <Link to={breadcrumb.to}>{breadcrumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

