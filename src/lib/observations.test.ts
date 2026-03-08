import { describe, expect, it } from 'vitest';

import { groupObservationsByBiomarkerCode } from '@/lib/observations';
import type { ObservationResource } from '@/types/api';

function obs(overrides: Partial<ObservationResource> & { biomarker_code: string | null; created_at: string }): ObservationResource {
  return {
    id: 1,
    biomarker_name: 'Test',
    biomarker_code: overrides.biomarker_code,
    value_type: 'numeric',
    value: 0,
    unit: null,
    reference_range_min: null,
    reference_range_max: null,
    reference_unit: null,
    created_at: overrides.created_at,
    updated_at: overrides.created_at,
    ...overrides,
  };
}

describe('groupObservationsByBiomarkerCode', () => {
  it('groups observations by biomarker_code', () => {
    const data: ObservationResource[] = [
      obs({ id: 1, biomarker_code: '718-7', created_at: '2025-01-01T00:00:00Z' }),
      obs({ id: 2, biomarker_code: '718-7', created_at: '2025-01-02T00:00:00Z' }),
      obs({ id: 3, biomarker_code: '2345-7', created_at: '2025-01-01T00:00:00Z' }),
    ];
    const result = groupObservationsByBiomarkerCode(data);
    expect(Object.keys(result)).toEqual(['718-7', '2345-7']);
    expect(result['718-7']).toHaveLength(2);
    expect(result['2345-7']).toHaveLength(1);
  });

  it('filters out observations with null biomarker_code', () => {
    const data: ObservationResource[] = [
      obs({ id: 1, biomarker_code: '718-7', created_at: '2025-01-01T00:00:00Z' }),
      obs({ id: 2, biomarker_code: null, created_at: '2025-01-02T00:00:00Z' }),
    ];
    const result = groupObservationsByBiomarkerCode(data);
    expect(Object.keys(result)).toEqual(['718-7']);
    expect(result['718-7']).toHaveLength(1);
  });

  it('sorts each group by created_at ascending', () => {
    const data: ObservationResource[] = [
      obs({ id: 1, biomarker_code: '718-7', created_at: '2025-01-03T00:00:00Z' }),
      obs({ id: 2, biomarker_code: '718-7', created_at: '2025-01-01T00:00:00Z' }),
      obs({ id: 3, biomarker_code: '718-7', created_at: '2025-01-02T00:00:00Z' }),
    ];
    const result = groupObservationsByBiomarkerCode(data);
    const group = result['718-7'];
    expect(group.map((o) => o.id)).toEqual([2, 3, 1]);
    expect(group.map((o) => o.created_at)).toEqual([
      '2025-01-01T00:00:00Z',
      '2025-01-02T00:00:00Z',
      '2025-01-03T00:00:00Z',
    ]);
  });

  it('returns empty object for empty input', () => {
    expect(groupObservationsByBiomarkerCode([])).toEqual({});
  });

  it('returns empty object when all observations have null biomarker_code', () => {
    const data: ObservationResource[] = [
      obs({ id: 1, biomarker_code: null, created_at: '2025-01-01T00:00:00Z' }),
    ];
    expect(groupObservationsByBiomarkerCode(data)).toEqual({});
  });

  it('handles reserved prototype keys from API safely (no prototype collision)', () => {
    const data: ObservationResource[] = [
      obs({ id: 1, biomarker_code: '__proto__', created_at: '2025-01-02T00:00:00Z' }),
      obs({ id: 2, biomarker_code: '__proto__', created_at: '2025-01-01T00:00:00Z' }),
      obs({ id: 3, biomarker_code: '718-7', created_at: '2025-01-01T00:00:00Z' }),
    ];
    const result = groupObservationsByBiomarkerCode(data);
    expect(Object.keys(result)).toContain('__proto__');
    expect(Object.keys(result)).toContain('718-7');
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['__proto__']).toHaveLength(2);
    expect(result['__proto__'].map((o) => o.id)).toEqual([2, 1]);
    expect(result['__proto__'].map((o) => o.created_at)).toEqual([
      '2025-01-01T00:00:00Z',
      '2025-01-02T00:00:00Z',
    ]);
    expect(result['718-7']).toHaveLength(1);
    expect(result['718-7'][0].id).toBe(3);
  });
});
