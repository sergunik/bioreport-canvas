import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
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
import { useToast } from '@/hooks/use-toast';
import { diagnosticReportService, observationService, ApiClientError } from '@/api';

interface ObservationRow {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRangeMin: string;
  referenceRangeMax: string;
  referenceUnit: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const initialObservation: ObservationRow = {
  id: generateId(),
  name: '',
  value: '',
  unit: '',
  referenceRangeMin: '',
  referenceRangeMax: '',
  referenceUnit: '',
};

export default function NewDiagnosticReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState<ObservationRow[]>([
    { ...initialObservation, id: generateId() },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addObservation = () => {
    setObservations((prev) => [
      ...prev,
      { ...initialObservation, id: generateId() },
    ]);
  };

  const removeObservation = (id: string) => {
    if (observations.length <= 1) return;
    setObservations((prev) => prev.filter((o) => o.id !== id));
  };

  const updateObservation = (
    id: string,
    field: keyof ObservationRow,
    value: string
  ) => {
    setObservations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
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
      toast({
        title: 'Validation Error',
        description: 'Please add at least one observation with a name and value.',
        variant: 'destructive',
      });
      return;
    }

    if (validObservations.some((o) => Number.isNaN(Number(o.value)))) {
      toast({
        title: 'Validation Error',
        description: 'Observation value must be a valid number.',
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

      for (const obs of validObservations) {
        const numValue = Number(obs.value);
        const min = obs.referenceRangeMin.trim()
          ? Number(obs.referenceRangeMin)
          : null;
        const max = obs.referenceRangeMax.trim()
          ? Number(obs.referenceRangeMax)
          : null;
        await observationService.create(report.id, {
          biomarker_name: obs.name.trim(),
          value: numValue,
          unit: obs.unit.trim() || '',
          reference_range_min: min !== null && !Number.isNaN(min) ? min : null,
          reference_range_max: max !== null && !Number.isNaN(max) ? max : null,
          reference_unit: obs.referenceUnit.trim() || null,
        });
      }

      toast({
        title: 'Report Created',
        description: 'Your diagnostic report has been saved.',
      });
      navigate(`/diagnostic-reports/${report.id}`);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.getFirstError() : 'An error occurred';
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
      <PageContainer size="lg">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 gap-2 text-muted-foreground"
            onClick={() => navigate('/diagnostic-reports')}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
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
                  onChange={(e) => setTitle(e.target.value)}
                />
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
                      <TableHead className="min-w-[100px]">Value</TableHead>
                      <TableHead className="min-w-[100px]">Unit</TableHead>
                      <TableHead className="min-w-[100px]">Ref. Min</TableHead>
                      <TableHead className="min-w-[100px]">Ref. Max</TableHead>
                      <TableHead className="min-w-[80px]">Ref. Unit</TableHead>
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
                          <Input
                            placeholder="e.g., 14.5"
                            value={obs.value}
                            onChange={(e) =>
                              updateObservation(obs.id, 'value', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., g/dL"
                            value={obs.unit}
                            onChange={(e) =>
                              updateObservation(obs.id, 'unit', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
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
                          />
                        </TableCell>
                        <TableCell>
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
                          />
                        </TableCell>
                        <TableCell>
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
                          />
                        </TableCell>
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
