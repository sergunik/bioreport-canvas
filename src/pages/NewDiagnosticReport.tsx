import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

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

interface Observation {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function NewDiagnosticReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState<Observation[]>([
    { id: generateId(), name: '', value: '', unit: '', referenceRange: '' },
  ]);

  const addObservation = () => {
    setObservations((prev) => [
      ...prev,
      { id: generateId(), name: '', value: '', unit: '', referenceRange: '' },
    ]);
  };

  const removeObservation = (id: string) => {
    if (observations.length <= 1) return;
    setObservations((prev) => prev.filter((o) => o.id !== id));
  };

  const updateObservation = (id: string, field: keyof Observation, value: string) => {
    setObservations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a report title.',
        variant: 'destructive',
      });
      return;
    }

    const hasValidObservation = observations.some(
      (o) => o.name.trim() && o.value.trim()
    );

    if (!hasValidObservation) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one observation with a name and value.',
        variant: 'destructive',
      });
      return;
    }

    // For now, just show success and navigate back
    toast({
      title: 'Report Created',
      description: 'Your diagnostic report has been saved.',
    });
    navigate('/diagnostic-reports');
  };

  return (
    <MainLayout>
      <PageContainer size="lg">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 gap-2 text-muted-foreground"
            onClick={() => navigate('/diagnostic-reports')}
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
          {/* Report Details */}
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

          {/* Observations Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Observations</h2>
                  <p className="text-sm text-muted-foreground">
                    Add biomarker results from your report
                  </p>
                </div>
                <Button type="button" variant="outline" className="gap-2" onClick={addObservation}>
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
                      <TableHead className="min-w-[140px]">Reference Range</TableHead>
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
                            onChange={(e) => updateObservation(obs.id, 'name', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., 14.5"
                            value={obs.value}
                            onChange={(e) => updateObservation(obs.id, 'value', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., g/dL"
                            value={obs.unit}
                            onChange={(e) => updateObservation(obs.id, 'unit', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., 12.0–17.5"
                            value={obs.referenceRange}
                            onChange={(e) =>
                              updateObservation(obs.id, 'referenceRange', e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeObservation(obs.id)}
                            disabled={observations.length <= 1}
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

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/diagnostic-reports')}
            >
              Cancel
            </Button>
            <Button type="submit">Save Report</Button>
          </div>
        </form>
      </PageContainer>
    </MainLayout>
  );
}
