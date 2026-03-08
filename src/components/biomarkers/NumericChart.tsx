import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { ObservationResource } from '@/types/api';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { formatDate } from '@/lib/date';

interface NumericChartProps {
  observations: ObservationResource[];
  unit: string | null;
}

function toChartPoint(obs: ObservationResource, index: number) {
  const value = typeof obs.value === 'number' ? obs.value : Number(obs.value);
  return {
    index,
    value: Number.isNaN(value) ? 0 : value,
    created_at: obs.created_at,
    ref_min: obs.reference_range_min,
    ref_max: obs.reference_range_max,
  };
}

export function NumericChart({ observations, unit }: NumericChartProps) {
  const { t } = useTranslation();
  const data = observations.map((o, i) => toChartPoint(o, i));
  const hasMultiple = data.length > 1;

  const chartConfig = {
    value: { label: t('biomarkers.value') },
    created_at: { label: t('biomarkers.date') },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="index"
            tickFormatter={(i) => (data[i] ? formatDate(data[i].created_at, { fallback: '', pattern: 'dateShort' }) : '')}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="value"
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => String(v)}
            width={32}
          />
          <Tooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [unit ? `${value} ${unit}` : String(value), t('biomarkers.value')]}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.created_at
                    ? formatDate(payload[0].payload.created_at, { fallback: '' })
                    : ''
                }
              />
            }
          />
          {data.map(
            (point, i) =>
              point.ref_min != null &&
              point.ref_max != null && (
                <ReferenceArea
                  key={i}
                  x1={i - 0.5}
                  x2={i + 0.5}
                  y1={point.ref_min}
                  y2={point.ref_max}
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.2}
                  strokeOpacity={0}
                />
              )
          )}
          <Line
            type={hasMultiple ? 'monotone' : 'linear'}
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 4, fill: 'hsl(var(--chart-1))' }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
    </ChartContainer>
  );
}
