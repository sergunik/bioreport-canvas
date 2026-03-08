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

const COLOR_IN_RANGE = 'hsl(142, 76%, 36%)';
const COLOR_OUT_OF_RANGE = 'hsl(0, 72%, 50%)';
const COLOR_REF_ZONE = 'hsl(142, 76%, 36%)';

interface NumericChartProps {
  observations: ObservationResource[];
  unit: string | null;
}

interface ChartPoint {
  index: number;
  value: number;
  created_at: string;
  ref_min: number | null;
  ref_max: number | null;
}

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: ChartPoint;
}

function toChartPoint(obs: ObservationResource, index: number): ChartPoint {
  const value = typeof obs.value === 'number' ? obs.value : Number(obs.value);
  return {
    index,
    value: Number.isNaN(value) ? 0 : value,
    created_at: obs.created_at,
    ref_min: obs.reference_range_min,
    ref_max: obs.reference_range_max,
  };
}

function inRange(value: number, refMin: number | null, refMax: number | null): boolean {
  if (refMin != null && value < refMin) return false;
  if (refMax != null && value > refMax) return false;
  return true;
}

export function NumericChart({ observations, unit }: NumericChartProps) {
  const { t } = useTranslation();
  const data = observations.map((o, i) => toChartPoint(o, i));
  const hasMultiple = data.length > 1;

  const refMin = data.find((d) => d.ref_min != null)?.ref_min ?? null;
  const refMax = data.find((d) => d.ref_max != null)?.ref_max ?? null;
  const showRefZone = refMin != null && refMax != null && refMin < refMax;

  const chartConfig = {
    value: { label: t('biomarkers.value') },
    created_at: { label: t('biomarkers.date') },
  };

  const getDotColor = (point: ChartPoint) =>
    inRange(point.value, point.ref_min, point.ref_max) ? COLOR_IN_RANGE : COLOR_OUT_OF_RANGE;

  const renderDot = (props: DotProps) => {
    const { cx, cy, index = 0, payload } = props;
    if (cx == null || cy == null || !payload) return null;
    const fill = getDotColor(payload);
    return <circle key={index} cx={cx} cy={cy} r={4} fill={fill} stroke={fill} strokeWidth={1} />;
  };

  const renderActiveDot = (props: DotProps) => {
    const { cx, cy, index = 0, payload } = props;
    if (cx == null || cy == null || !payload) return null;
    const fill = getDotColor(payload);
    return <circle key={index} cx={cx} cy={cy} r={5} fill={fill} stroke={fill} strokeWidth={2} />;
  };

  const yMin = data.length ? Math.min(...data.map((d) => d.value), refMin ?? Infinity, refMax ?? Infinity) : 0;
  const yMax = data.length ? Math.max(...data.map((d) => d.value), refMin ?? -Infinity, refMax ?? -Infinity) : 10;
  const yDomain = data.length ? [yMin, yMax] as [number, number] : undefined;

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        {showRefZone && (
          <ReferenceArea
            x1={0}
            x2={Math.max(1, data.length - 1)}
            y1={refMin}
            y2={refMax}
            fill={COLOR_REF_ZONE}
            fillOpacity={0.35}
            strokeOpacity={0}
            isFront={false}
          />
        )}
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="index"
          tickFormatter={(i) => (data[i] ? formatDate(data[i].created_at, { fallback: '', pattern: 'dateShort' }) : '')}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="value"
          domain={yDomain}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => String(v)}
          width={32}
        />
        <Tooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {unit ? `${value} ${unit}` : String(value)}
                </span>
              )}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.created_at
                  ? formatDate(payload[0].payload.created_at, { fallback: '' })
                  : ''
              }
            />
          }
        />
        <Line
          type={hasMultiple ? 'monotone' : 'linear'}
          dataKey="value"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={renderDot}
          activeDot={renderActiveDot}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
