import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/diagnostic-reports') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/biomarkers')
  );
}

function segmentLabel(segment: string, prevSegment?: string): string {
  if (segment === 'diagnostic-reports') return 'Reports';
  if (segment === 'documents') return 'Documents';
  if (segment === 'settings') return 'Settings';
  if (segment === 'biomarkers') return 'Biomarkers';
  if (segment === 'new') return 'New';
  if (segment === 'upload') return 'Upload';
  if (segment === 'profile') return 'Profile';
  if (segment === 'security') return 'Security';
  if (segment === 'sensitive-words') return 'Sensitive Words';
  if (segment === 'danger') return 'Danger Zone';
  if (prevSegment === 'diagnostic-reports' && /^\d+$/.test(segment)) return `Report ${segment}`;
  if (prevSegment === 'documents') return 'Document';
  return segment;
}

export function PageBreadcrumbs() {
  const { pathname } = useLocation();

  if (!isProtectedPath(pathname) || pathname === '/dashboard') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; to: string }> = [{ label: 'Dashboard', to: '/dashboard' }];

  let currentPath = '';
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (segment === 'dashboard') {
      continue;
    }
    currentPath += `/${segment}`;
    crumbs.push({
      label: segmentLabel(segment, segments[i - 1]),
      to: currentPath,
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <BreadcrumbItem key={`${crumb.to}-${index}`}>
            <BreadcrumbLink
              asChild
              className="text-muted-foreground hover:underline hover:text-muted-foreground"
            >
              <Link to={crumb.to}>{crumb.label}</Link>
            </BreadcrumbLink>
            {index < crumbs.length - 1 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

