import { useTranslation } from 'react-i18next';
import type { ObservationResource } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { NumericChart } from '@/components/biomarkers/NumericChart';
import { BooleanChart } from '@/components/biomarkers/BooleanChart';
import { TextTimeline } from '@/components/biomarkers/TextTimeline';
import { formatDate } from '@/lib/date';

interface BiomarkerCardProps {
  observations: ObservationResource[];
}

export function BiomarkerCard({ observations }: BiomarkerCardProps) {
  const { t } = useTranslation();
  if (observations.length === 0) return null;

  const first = observations[0];
  const latest = observations[observations.length - 1];
  const name = first.biomarker_name;
  const code = first.biomarker_code ?? '';
  const unit = latest.unit ? ` ${latest.unit}` : '';
  const valueType = first.value_type;

  const renderChart = () => {
    switch (valueType) {
      case 'numeric':
        return <NumericChart observations={observations} unit={latest.unit} />;
      case 'boolean':
        return <BooleanChart observations={observations} />;
      case 'text':
        return <TextTimeline observations={observations} />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{t('biomarkers.code')}: {code}</p>
          <p className="mt-1 text-sm text-foreground">
            {t('biomarkers.latestValue')}: {String(latest.value)}{unit}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('biomarkers.lastUpdated')}: {formatDate(latest.updated_at)}
          </p>
        </div>
        {renderChart()}
      </CardContent>
    </Card>
  );
}
