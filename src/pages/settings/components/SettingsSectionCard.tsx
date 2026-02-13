import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

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
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClassName ?? 'bg-secondary'}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
