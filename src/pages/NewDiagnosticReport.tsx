import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
import { PageBreadcrumbs } from '@/components/layout/PageBreadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { diagnosticReportService, observationService, ApiClientError } from '@/api';
import { cn } from '@/lib/utils';
import type { ObservationValueType, StoreObservationRequest } from '@/types/api';

interface ObservationRow {
  id: string;
  name: string;
  valueType: ObservationValueType | '';
  value: string;
  unit: string;
  referenceRangeMin: string;
  referenceRangeMax: string;
  referenceUnit: string;
}

const markerTypeOptions: ObservationValueType[] = ['numeric', 'boolean', 'text'];

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const initialObservation: ObservationRow = {
  id: generateId(),
  name: '',
  valueType: 'numeric',
  value: '',
  unit: '',
  referenceRangeMin: '',
  referenceRangeMax: '',
  referenceUnit: '',
};

function parseNumeric(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }
  const numericValue = Number(trimmed);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseBoolean(rawValue: string): boolean | null {
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }
  if (normalized === 'false' || normalized === '0') {
    return false;
  }
  return null;
}

function parseObservationPayload(
  rawValue: string,
  preferredType: ObservationValueType | ''
): { value_type: ObservationValueType; value: number | boolean | string } | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  if (preferredType === 'numeric') {
    const numericValue = parseNumeric(trimmed);
    return numericValue === null ? null : { value_type: 'numeric', value: numericValue };
  }

  if (preferredType === 'boolean') {
    const booleanValue = parseBoolean(trimmed);
    return booleanValue === null ? null : { value_type: 'boolean', value: booleanValue };
  }

  if (preferredType === 'text') {
    return { value_type: 'text', value: trimmed };
  }

  const inferredBoolean = parseBoolean(trimmed);
  if (inferredBoolean !== null) {
    return { value_type: 'boolean', value: inferredBoolean };
  }

  const inferredNumber = parseNumeric(trimmed);
  if (inferredNumber !== null) {
    return { value_type: 'numeric', value: inferredNumber };
  }

  return { value_type: 'text', value: trimmed };
}

export default function NewDiagnosticReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState<ObservationRow[]>([
    { ...initialObservation, id: generateId() },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [invalidValueRowIds, setInvalidValueRowIds] = useState<string[]>([]);
  const [invalidUnitRowIds, setInvalidUnitRowIds] = useState<string[]>([]);
  const [invalidReferenceRowIds, setInvalidReferenceRowIds] = useState<string[]>([]);
  const showNumericColumns = observations.some((obs) => obs.valueType === 'numeric');

  const addObservation = () => {
    setRowsError(null);
    setObservations((prev) => [
      ...prev,
      { ...initialObservation, id: generateId() },
    ]);
  };

  const removeObservation = (id: string) => {
    if (observations.length <= 1) return;
    setInvalidValueRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setInvalidUnitRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setInvalidReferenceRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setObservations((prev) => prev.filter((o) => o.id !== id));
  };

  const updateObservation = (
    id: string,
    field: keyof ObservationRow,
    value: string
  ) => {
    if (field === 'value') {
      setInvalidValueRowIds((prev) => prev.filter((rowId) => rowId !== id));
      setInvalidUnitRowIds((prev) => prev.filter((rowId) => rowId !== id));
      setInvalidReferenceRowIds((prev) => prev.filter((rowId) => rowId !== id));
      setRowsError(null);
    }
    if (field === 'unit') {
      setInvalidUnitRowIds((prev) => prev.filter((rowId) => rowId !== id));
      setRowsError(null);
    }
    if (field === 'referenceRangeMin' || field === 'referenceRangeMax' || field === 'referenceUnit') {
      setInvalidReferenceRowIds((prev) => prev.filter((rowId) => rowId !== id));
      setRowsError(null);
    }
    setObservations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const updateObservationType = (id: string, valueType: ObservationValueType) => {
    setInvalidValueRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setInvalidUnitRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setInvalidReferenceRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setRowsError(null);

    setObservations((prev) =>
      prev.map((row) => {
        if (row.id !== id) {
          return row;
        }
        if (valueType === 'numeric') {
          return { ...row, valueType };
        }
        return {
          ...row,
          valueType,
          referenceRangeMin: '',
          referenceRangeMax: '',
          referenceUnit: '',
          value:
            valueType === 'boolean' &&
            (row.value.trim().toLowerCase() === 'true' ||
              row.value.trim().toLowerCase() === 'false')
              ? row.value.trim().toLowerCase()
              : valueType === 'boolean'
                ? ''
                : row.value,
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError(null);
    setRowsError(null);
    setInvalidValueRowIds([]);
    setInvalidUnitRowIds([]);
    setInvalidReferenceRowIds([]);

    if (!title.trim()) {
      setTitleError('Please provide a report title.');
      toast({
        title: 'Validation Error',
        description: 'Please provide a report title.',
        variant: 'destructive',
      });
      return;
    }

    const validObservations = observations.filter(
      (o) => o.name.trim() && o.value.trim()
    );
    if (validObservations.length === 0) {
      setRowsError('Please add at least one observation with a name and value.');
      toast({
        title: 'Validation Error',
        description: 'Please add at least one observation with a name and value.',
        variant: 'destructive',
      });
      return;
    }

    const parsedRows = validObservations
      .map((row) => ({ row, parsed: parseObservationPayload(row.value, row.valueType) }))
      .filter((entry) => entry.parsed !== null);

    if (parsedRows.length === 0) {
      setInvalidValueRowIds(
        validObservations.map((o) => o.id)
      );
      setRowsError('Observation value type is invalid for the provided value.');
      toast({
        title: 'Validation Error',
        description: 'Observation value type is invalid for the provided value.',
        variant: 'destructive',
      });
      return;
    }

    const payloads: Array<{ rowId: string; payload: StoreObservationRequest }> = [];
    const nextInvalidUnitRowIds: string[] = [];
    const nextInvalidReferenceRowIds: string[] = [];

    for (const entry of parsedRows) {
      const { row, parsed } = entry;
      const unit = row.unit.trim();
      const hasReferenceInput = Boolean(
        row.referenceRangeMin.trim() || row.referenceRangeMax.trim() || row.referenceUnit.trim()
      );

      if (parsed.value_type === 'numeric') {
        if (!unit) {
          nextInvalidUnitRowIds.push(row.id);
          continue;
        }

        const min = row.referenceRangeMin.trim() ? parseNumeric(row.referenceRangeMin) : null;
        const max = row.referenceRangeMax.trim() ? parseNumeric(row.referenceRangeMax) : null;
        if (
          (row.referenceRangeMin.trim() && min === null) ||
          (row.referenceRangeMax.trim() && max === null)
        ) {
          nextInvalidReferenceRowIds.push(row.id);
          continue;
        }

        payloads.push({
          rowId: row.id,
          payload: {
            biomarker_name: row.name.trim(),
            value_type: 'numeric',
            value: parsed.value,
            unit,
            reference_range_min: min,
            reference_range_max: max,
            reference_unit: row.referenceUnit.trim() || null,
          },
        });
        continue;
      }

      if (hasReferenceInput) {
        nextInvalidReferenceRowIds.push(row.id);
        continue;
      }

      payloads.push({
        rowId: row.id,
        payload: {
          biomarker_name: row.name.trim(),
          value_type: parsed.value_type,
          value: parsed.value,
          unit: unit || null,
          reference_range_min: null,
          reference_range_max: null,
          reference_unit: null,
        },
      });
    }

    if (nextInvalidUnitRowIds.length > 0) {
      setInvalidUnitRowIds(nextInvalidUnitRowIds);
      setRowsError('Unit is required for numeric observations.');
      toast({
        title: 'Validation Error',
        description: 'Unit is required for numeric observations.',
        variant: 'destructive',
      });
      return;
    }

    if (nextInvalidReferenceRowIds.length > 0) {
      setInvalidReferenceRowIds(nextInvalidReferenceRowIds);
      setRowsError('Reference ranges are allowed only for numeric observations.');
      toast({
        title: 'Validation Error',
        description: 'Reference ranges are allowed only for numeric observations.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await diagnosticReportService.create({
        title: title.trim() || null,
        notes: notes.trim() || null,
      });

      await observationService.createBatch(report.id, {
        observations: payloads.map((entry) => entry.payload),
      });

      setObservations((prev) =>
        prev.map((row) => {
          const matched = payloads.find((entry) => entry.rowId === row.id);
          if (!matched) {
            return row;
          }
          return {
            ...row,
            valueType: matched.payload.value_type ?? row.valueType,
            unit: matched.payload.unit ?? '',
          };
        })
      );

      toast({
        title: 'Report Created',
        description: 'Your diagnostic report has been saved.',
      });
      navigate(`/diagnostic-reports/${report.id}`);
    } catch (err) {
      let message = 'An error occurred';
      if (err instanceof ApiClientError) {
        message = err.getFirstError();

        if (err.isValidationError()) {
          const fieldErrors = err.getFieldErrors();
          const backendInvalidValueRows = new Set<string>();
          const backendInvalidUnitRows = new Set<string>();
          const backendInvalidReferenceRows = new Set<string>();

          for (const fieldKey of Object.keys(fieldErrors)) {
            const match = fieldKey.match(/^observations\.(\d+)\.(.+)$/);
            if (match) {
              const rowId = payloads[Number(match[1])]?.rowId;
              const nestedField = match[2];
              if (!rowId) {
                continue;
              }
              if (nestedField === 'value' || nestedField === 'value_type') {
                backendInvalidValueRows.add(rowId);
              }
              if (nestedField === 'unit') {
                backendInvalidUnitRows.add(rowId);
              }
              if (
                nestedField === 'reference_range_min' ||
                nestedField === 'reference_range_max' ||
                nestedField === 'reference_unit'
              ) {
                backendInvalidReferenceRows.add(rowId);
              }
              continue;
            }

            if (fieldKey === 'value' || fieldKey === 'value_type') {
              for (const entry of payloads) backendInvalidValueRows.add(entry.rowId);
            }
            if (fieldKey === 'unit') {
              for (const entry of payloads) backendInvalidUnitRows.add(entry.rowId);
            }
            if (
              fieldKey === 'reference_range_min' ||
              fieldKey === 'reference_range_max' ||
              fieldKey === 'reference_unit'
            ) {
              for (const entry of payloads) backendInvalidReferenceRows.add(entry.rowId);
            }
          }

          if (backendInvalidValueRows.size > 0) {
            setInvalidValueRowIds(Array.from(backendInvalidValueRows));
          }
          if (backendInvalidUnitRows.size > 0) {
            setInvalidUnitRowIds(Array.from(backendInvalidUnitRows));
          }
          if (backendInvalidReferenceRows.size > 0) {
            setInvalidReferenceRowIds(Array.from(backendInvalidReferenceRows));
          }
          if (message) {
            setRowsError(message);
          }
        }
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <PageContainer size="xl">
        <div className="mb-4">
          <PageBreadcrumbs />
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">New Diagnostic Report</h1>
          <p className="mt-2 text-muted-foreground">
            Enter the details of your diagnostic report and observations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Blood Test - January 2026"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleError(null);
                  }}
                  aria-invalid={!!titleError}
                  className={cn(titleError && 'border-destructive')}
                />
                {titleError && <p className="text-sm text-destructive">{titleError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this report..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Observations</h2>
                  <p className="text-sm text-muted-foreground">
                    Add biomarker results from your report
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={addObservation}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Biomarker Name</TableHead>
                      <TableHead className="min-w-[150px]">Marker Type</TableHead>
                      <TableHead className="min-w-[100px]">Value</TableHead>
                      {showNumericColumns && (
                        <>
                          <TableHead className="min-w-[100px]">Unit</TableHead>
                          <TableHead className="min-w-[100px]">Ref. Min</TableHead>
                          <TableHead className="min-w-[100px]">Ref. Max</TableHead>
                          <TableHead className="min-w-[80px]">Ref. Unit</TableHead>
                        </>
                      )}
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observations.map((obs) => (
                      <TableRow key={obs.id}>
                        <TableCell>
                          <Input
                            placeholder="e.g., Hemoglobin"
                            value={obs.name}
                            onChange={(e) =>
                              updateObservation(obs.id, 'name', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={obs.valueType || 'numeric'}
                            onValueChange={(nextType) =>
                              updateObservationType(obs.id, nextType as ObservationValueType)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {markerTypeOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option === 'numeric'
                                    ? 'Numeric'
                                    : option === 'boolean'
                                      ? 'Positive / Negative'
                                      : 'Text'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {obs.valueType === 'boolean' ? (
                            <Select
                              value={obs.value.toLowerCase()}
                              onValueChange={(nextValue) =>
                                updateObservation(obs.id, 'value', nextValue)
                              }
                            >
                              <SelectTrigger
                                aria-invalid={invalidValueRowIds.includes(obs.id)}
                                className={cn(
                                  invalidValueRowIds.includes(obs.id) && 'border-destructive'
                                )}
                              >
                                <SelectValue placeholder="Result" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Positive</SelectItem>
                                <SelectItem value="false">Negative</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder={
                                obs.valueType === 'text' ? 'e.g., Detected' : 'e.g., 14.5'
                              }
                              value={obs.value}
                              onChange={(e) =>
                                updateObservation(obs.id, 'value', e.target.value)
                              }
                              aria-invalid={invalidValueRowIds.includes(obs.id)}
                              className={cn(
                                invalidValueRowIds.includes(obs.id) && 'border-destructive'
                              )}
                            />
                          )}
                        </TableCell>
                        {showNumericColumns && (
                          <>
                            <TableCell>
                              {obs.valueType === 'numeric' ? (
                                <Input
                                  placeholder="e.g., g/dL"
                                  value={obs.unit}
                                  onChange={(e) =>
                                    updateObservation(obs.id, 'unit', e.target.value)
                                  }
                                  aria-invalid={invalidUnitRowIds.includes(obs.id)}
                                  className={cn(
                                    invalidUnitRowIds.includes(obs.id) && 'border-destructive'
                                  )}
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {obs.valueType === 'numeric' ? (
                                <Input
                                  placeholder="e.g., 12"
                                  value={obs.referenceRangeMin}
                                  onChange={(e) =>
                                    updateObservation(
                                      obs.id,
                                      'referenceRangeMin',
                                      e.target.value
                                    )
                                  }
                                  aria-invalid={invalidReferenceRowIds.includes(obs.id)}
                                  className={cn(
                                    invalidReferenceRowIds.includes(obs.id) && 'border-destructive'
                                  )}
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {obs.valueType === 'numeric' ? (
                                <Input
                                  placeholder="e.g., 17.5"
                                  value={obs.referenceRangeMax}
                                  onChange={(e) =>
                                    updateObservation(
                                      obs.id,
                                      'referenceRangeMax',
                                      e.target.value
                                    )
                                  }
                                  aria-invalid={invalidReferenceRowIds.includes(obs.id)}
                                  className={cn(
                                    invalidReferenceRowIds.includes(obs.id) && 'border-destructive'
                                  )}
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {obs.valueType === 'numeric' ? (
                                <Input
                                  placeholder="e.g., g/dL"
                                  value={obs.referenceUnit}
                                  onChange={(e) =>
                                    updateObservation(
                                      obs.id,
                                      'referenceUnit',
                                      e.target.value
                                    )
                                  }
                                  aria-invalid={invalidReferenceRowIds.includes(obs.id)}
                                  className={cn(
                                    invalidReferenceRowIds.includes(obs.id) && 'border-destructive'
                                  )}
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeObservation(obs.id)}
                            disabled={observations.length <= 1 || isSubmitting}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rowsError && <p className="mt-4 text-sm text-destructive">{rowsError}</p>}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/diagnostic-reports')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Report'
              )}
            </Button>
          </div>
        </form>
      </PageContainer>
    </MainLayout>
  );
}
