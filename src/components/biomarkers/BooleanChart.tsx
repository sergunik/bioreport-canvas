import { useTranslation } from 'react-i18next';
import type { ObservationResource } from '@/types/api';
import { cn } from '@/lib/utils';
import { parseDate, formatDate } from '@/lib/date';

interface BooleanChartProps {
  observations: ObservationResource[];
}

function toStatePoint(
  obs: ObservationResource,
  index: number,
  translatedLabelPositive: string,
  translatedLabelNegative: string
) {
  const v = obs.value;
  const bool = v === true || v === 'true' || String(v).toLowerCase() === 'true';
  const date = parseDate(obs.created_at);
  const ts = date ? date.getTime() : 0;
  return {
    index,
    label: bool ? translatedLabelPositive : translatedLabelNegative,
    state: bool ? 'positive' : 'negative',
    created_at: obs.created_at,
    timestamp: ts,
  };
}

export function BooleanChart({ observations }: BooleanChartProps) {
  const { t } = useTranslation();
  const labelPositive = t('documents.details.booleanValueOptions.positive');
  const labelNegative = t('documents.details.booleanValueOptions.negative');
  const data = observations.map((o, i) =>
    toStatePoint(o, i, labelPositive, labelNegative)
  );
  const timestamps = data.map((d) => d.timestamp);
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const timeRange = Math.max(1, maxTs - minTs);
  const firstYear = new Date(minTs).getFullYear();
  const lastYear = new Date(maxTs).getFullYear();
  const yearTicks =
    Number.isNaN(firstYear) || Number.isNaN(lastYear)
      ? []
      : Array.from({ length: Math.max(1, lastYear - firstYear + 1) }, (_, i) => firstYear + i);

  const positionByTime = (timestamp: number) => ((timestamp - minTs) / timeRange) * 100;

  return (
    <div className="space-y-3">
      <div className="relative h-8 w-full">
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-border" />
        {yearTicks.map((year) => {
          const yearTs = new Date(`${year}-01-01T00:00:00.000Z`).getTime();
          const left = positionByTime(Math.min(Math.max(yearTs, minTs), maxTs));
          return (
            <div
              key={year}
              className="absolute top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-border/70"
              style={{ left: `${left}%` }}
              aria-hidden
            />
          );
        })}
        {data.map((point) => (
          <div
            key={point.index}
            className={cn(
              'group absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-sm transition-opacity hover:opacity-90',
              point.state === 'negative'
                ? 'bg-[hsl(var(--success))]'
                : 'bg-[hsl(var(--destructive))]'
            )}
            style={{ left: `${positionByTime(point.timestamp)}%` }}
            title={`${point.label} • ${formatDate(point.created_at, { fallback: '' })}`}
            aria-label={`${point.label} at ${formatDate(point.created_at, { fallback: '' })}`}
          >
            <span className="pointer-events-none absolute left-1/2 top-[-0.65rem] z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow-sm group-hover:block">
              {formatDate(point.created_at, { fallback: '' })}
            </span>
          </div>
        ))}
      </div>

      <div className="relative h-4 w-full">
        {yearTicks.map((year) => {
          const yearTs = new Date(`${year}-01-01T00:00:00.000Z`).getTime();
          const left = positionByTime(Math.min(Math.max(yearTs, minTs), maxTs));
          return (
            <span
              key={`label-${year}`}
              className="absolute -translate-x-1/2 text-xs text-muted-foreground"
              style={{ left: `${left}%` }}
            >
              {year}
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
          <span>{t('biomarkers.chartLegendNegative')}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--destructive))]" />
          <span>{t('biomarkers.chartLegendPositive')}</span>
        </div>
      </div>
    </div>
  );
}
