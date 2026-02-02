import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-7xl',
};

export function PageContainer({
  children,
  className,
  size = 'full',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-8 md:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}
