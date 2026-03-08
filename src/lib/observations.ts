import type { ObservationResource } from '@/types/api';
import { parseDate } from '@/lib/date';

function createdAtTime(iso: string): number {
  const date = parseDate(iso);
  return date ? date.getTime() : 0;
}

export function groupObservationsByBiomarkerCode(
  data: ObservationResource[]
): Record<string, ObservationResource[]> {
  const filtered = data.filter((o): o is ObservationResource & { biomarker_code: string } =>
    Boolean(o.biomarker_code)
  );
  const groups = Object.create(null) as Record<string, ObservationResource[]>;
  for (const o of filtered) {
    const code = o.biomarker_code;
    if (!groups[code]) groups[code] = [];
    groups[code].push(o);
  }
  for (const code of Object.keys(groups)) {
    groups[code].sort((a, b) => createdAtTime(a.created_at) - createdAtTime(b.created_at));
  }
  return groups;
}
