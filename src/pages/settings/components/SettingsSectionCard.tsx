import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SettingsSectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  cardClassName?: string;
  children: ReactNode;
}

export default function SettingsSectionCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  cardClassName,
  children,
}: SettingsSectionCardProps) {
  return (
    <Card className={cardClassName}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {Icon && (
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconClassName ?? 'bg-secondary')}>
              <Icon className="h-5 w-5 shrink-0" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle>{title}</CardTitle>
            {description != null && description !== '' ? (
              typeof description === 'string' && description.includes('\n\n') ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  {description.split(/\n\n+/).map((paragraph, i) => (
                    <p key={i}>{paragraph.trim()}</p>
                  ))}
                </div>
              ) : (
                <CardDescription>{description}</CardDescription>
              )
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
