import { format } from 'date-fns';
import type { ObservationResource } from '@/types/api';

interface TextTimelineProps {
  observations: ObservationResource[];
}

export function TextTimeline({ observations }: TextTimelineProps) {
  return (
    <div className="space-y-2">
      {observations.map((obs) => (
        <div
          key={obs.id}
          className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
        >
          <span className="text-foreground">{String(obs.value)}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {format(new Date(obs.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      ))}
    </div>
  );
}
