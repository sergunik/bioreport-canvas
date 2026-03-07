import type { ObservationResource } from '@/types/api';

export function groupObservationsByBiomarkerCode(
  data: ObservationResource[]
): Record<string, ObservationResource[]> {
  const filtered = data.filter((o): o is ObservationResource & { biomarker_code: string } =>
    Boolean(o.biomarker_code)
  );
  const groups: Record<string, ObservationResource[]> = {};
  for (const o of filtered) {
    const code = o.biomarker_code;
    if (!groups[code]) groups[code] = [];
    groups[code].push(o);
  }
  for (const code of Object.keys(groups)) {
    groups[code].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  return groups;
}
