import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2, Plus, Trash2, ZoomIn, ZoomOut } from 'lucide-react';

import { MainLayout, PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { diagnosticReportService, observationService, documentService, ApiClientError } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type {
  DocumentFinalResult,
  DocumentFinalResultMarker,
  DocumentJobStatus,
  DocumentMetadataResource,
  ObservationValueType,
  StoreObservationRequest,
} from '@/types/api';

interface ObservationRow {
  id: string;
  name: string;
  code: string;
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

function formatDate(iso: string | null): string {
  if (!iso) {
    return '-';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

function statusVariant(
  status: DocumentJobStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'processing':
      return 'default';
    case 'done':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function statusLabel(status: DocumentJobStatus, t: (key: string) => string): string {
  if (!status) {
    return t('documents.list.statusValue.unknown');
  }

  const knownStatuses: Set<NonNullable<DocumentJobStatus>> = new Set([
    'pending',
    'processing',
    'done',
    'failed',
  ]);
  if (!knownStatuses.has(status)) {
    return t('documents.list.statusValue.unknown');
  }

  return t(`documents.list.statusValue.${status}`);
}

function toStatus(metadata: DocumentMetadataResource): DocumentJobStatus {
  return metadata.job_status ?? metadata.status ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isFinalResult(value: unknown): value is DocumentFinalResult {
  if (!isRecord(value)) {
    return false;
  }

  const person = value.person;
  const markers = value.markers;
  const pii = value.pii;

  if (!isRecord(person) || !Array.isArray(markers) || !Array.isArray(pii)) {
    return false;
  }

  return typeof person.name === 'string' && ('dob' in person);
}

function markerValueToString(marker: DocumentFinalResultMarker): string {
  if (marker.value.type === 'numeric') {
    return marker.value.number === null ? '' : String(marker.value.number);
  }
  if (marker.value.type === 'boolean') {
    return marker.value.value === null ? '' : String(marker.value.value);
  }
  return marker.value.text ?? '';
}

function mapMarkerToRow(marker: DocumentFinalResultMarker): ObservationRow {
  return {
    id: generateId(),
    name: marker.name ?? '',
    code: marker.code ?? '',
    valueType: marker.value.type,
    value: markerValueToString(marker),
    unit: marker.value.unit ?? '',
    referenceRangeMin:
      marker.reference_range?.min === null || marker.reference_range?.min === undefined
        ? ''
        : String(marker.reference_range.min),
    referenceRangeMax:
      marker.reference_range?.max === null || marker.reference_range?.max === undefined
        ? ''
        : String(marker.reference_range.max),
    referenceUnit: marker.reference_range?.unit ?? '',
  };
}

function buildDefaultTitle(uuid: string, diagnosticDate: string | null, fallbackDate: string): string {
  return `Document ${uuid} - ${diagnosticDate ?? fallbackDate}`;
}

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

const initialObservation: ObservationRow = {
  id: generateId(),
  name: '',
  code: '',
  valueType: 'numeric',
  value: '',
  unit: '',
  referenceRangeMin: '',
  referenceRangeMax: '',
  referenceUnit: '',
};

export default function DocumentDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { uuid } = useParams<{ uuid: string }>();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [observations, setObservations] = useState<ObservationRow[]>([
    { ...initialObservation, id: generateId() },
  ]);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [invalidValueRowIds, setInvalidValueRowIds] = useState<string[]>([]);
  const [invalidUnitRowIds, setInvalidUnitRowIds] = useState<string[]>([]);
  const [invalidReferenceRowIds, setInvalidReferenceRowIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);
  const pdfObjectUrlRef = useRef<string | null>(null);

  const metadataQuery = useQuery({
    queryKey: ['document-metadata', uuid],
    queryFn: () => documentService.getMetadata(uuid as string),
    enabled: Boolean(uuid),
  });

  const deleteMutation = useMutation({
    mutationFn: (documentUuid: string) => documentService.delete(documentUuid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: t('common.success'),
        description: t('documents.details.deleteSuccess'),
      });
      navigate('/documents', { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiClientError) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: t('common.error'),
        description: t('documents.details.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const metadata = metadataQuery.data;
  const documentStatus = metadata ? toStatus(metadata) : null;
  const isDone = documentStatus === 'done';
  const isFailed = documentStatus === 'failed';
  const isPendingOrProcessing = documentStatus === 'pending' || documentStatus === 'processing';
  const showNumericColumns = observations.some((row) => row.valueType === 'numeric');

  const addObservation = () => {
    setRowsError(null);
    setObservations((prev) => [...prev, { ...initialObservation, id: generateId() }]);
  };

  const removeObservation = (id: string) => {
    if (observations.length <= 1) {
      return;
    }
    setInvalidValueRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setInvalidUnitRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setInvalidReferenceRowIds((prev) => prev.filter((rowId) => rowId !== id));
    setObservations((prev) => prev.filter((row) => row.id !== id));
  };

  const updateObservation = (id: string, field: keyof ObservationRow, value: string) => {
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
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
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
            valueType === 'boolean' && (row.value.trim().toLowerCase() === 'true' || row.value.trim().toLowerCase() === 'false')
              ? row.value.trim().toLowerCase()
              : valueType === 'boolean'
                ? ''
                : row.value,
        };
      })
    );
  };

  const onDeleteConfirm = () => {
    if (!uuid || deleteMutation.isPending) {
      return;
    }
    deleteMutation.mutate(uuid);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setTitleError(null);
    setRowsError(null);
    setInvalidValueRowIds([]);
    setInvalidUnitRowIds([]);
    setInvalidReferenceRowIds([]);
    if (!title.trim()) {
      setTitleError(t('documents.details.validationTitle'));
      toast({
        title: t('common.error'),
        description: t('documents.details.validationTitle'),
        variant: 'destructive',
      });
      return;
    }

    const filledRows = observations.filter((row) => row.name.trim() && row.value.trim());
    if (filledRows.length === 0) {
      setRowsError(t('documents.details.validationRows'));
      toast({
        title: t('common.error'),
        description: t('documents.details.validationRows'),
        variant: 'destructive',
      });
      return;
    }

    const parsedRows = filledRows
      .map((row) => ({ row, parsed: parseObservationPayload(row.value, row.valueType) }))
      .filter((entry) => entry.parsed !== null);

    if (parsedRows.length === 0) {
      const invalidRows = filledRows.map((row) => row.id);
      setInvalidValueRowIds(invalidRows);
      setRowsError(t('documents.details.validationValueType'));
      toast({
        title: t('common.error'),
        description: t('documents.details.validationValueType'),
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
            biomarker_code: row.code.trim() || null,
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
          biomarker_code: row.code.trim() || null,
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
      setRowsError(t('documents.details.validationUnitRequired'));
      toast({
        title: t('common.error'),
        description: t('documents.details.validationUnitRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (nextInvalidReferenceRowIds.length > 0) {
      setInvalidReferenceRowIds(nextInvalidReferenceRowIds);
      setRowsError(t('documents.details.validationReferenceOnlyNumeric'));
      toast({
        title: t('common.error'),
        description: t('documents.details.validationReferenceOnlyNumeric'),
        variant: 'destructive',
      });
      return;
    }

    setIsSavingReport(true);
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

      if (payloads.length !== filledRows.length) {
        toast({
          title: t('common.success'),
          description: t('documents.details.partialSaveNotice'),
        });
      } else {
        toast({
          title: t('common.success'),
          description: t('documents.details.saveSuccess'),
        });
      }
      navigate(`/diagnostic-reports/${report.id}`);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isValidationError()) {
          const fieldErrors = error.getFieldErrors();
          const backendInvalidValueRows = new Set<string>();
          const backendInvalidUnitRows = new Set<string>();
          const backendInvalidReferenceRows = new Set<string>();
          let firstBackendError: string | null = null;

          Object.entries(fieldErrors).forEach(([fieldKey, messages]) => {
            const message = messages?.[0];
            if (!message) {
              return;
            }
            if (!firstBackendError) {
              firstBackendError = message;
            }

            const match = fieldKey.match(/^observations\.(\d+)\.(.+)$/);
            if (match) {
              const observationIndex = Number(match[1]);
              const nestedField = match[2];
              const rowId = payloads[observationIndex]?.rowId;
              if (!rowId) {
                return;
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
              return;
            }

            if (fieldKey === 'value' || fieldKey === 'value_type') {
              payloads.forEach((entry) => backendInvalidValueRows.add(entry.rowId));
            }
            if (fieldKey === 'unit') {
              payloads.forEach((entry) => backendInvalidUnitRows.add(entry.rowId));
            }
            if (
              fieldKey === 'reference_range_min' ||
              fieldKey === 'reference_range_max' ||
              fieldKey === 'reference_unit'
            ) {
              payloads.forEach((entry) => backendInvalidReferenceRows.add(entry.rowId));
            }
          });

          if (backendInvalidValueRows.size > 0) {
            setInvalidValueRowIds(Array.from(backendInvalidValueRows));
          }
          if (backendInvalidUnitRows.size > 0) {
            setInvalidUnitRowIds(Array.from(backendInvalidUnitRows));
          }
          if (backendInvalidReferenceRows.size > 0) {
            setInvalidReferenceRowIds(Array.from(backendInvalidReferenceRows));
          }
          if (firstBackendError) {
            setRowsError(firstBackendError);
          }
        }

        toast({
          title: t('common.error'),
          description: error.getFirstError(),
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingReport(false);
    }
  };

  useEffect(() => {
    if (!metadata || !isDone || hasPrefilled || !uuid) {
      return;
    }

    const maybeFinalResult = metadata.final_result;
    if (!isFinalResult(maybeFinalResult)) {
      setTitle(buildDefaultTitle(uuid, null, formatDate(metadata.created_at)));
      setObservations([{ ...initialObservation, id: generateId() }]);
      setHasPrefilled(true);
      return;
    }

    setTitle(
      buildDefaultTitle(uuid, maybeFinalResult.diagnostic_date, formatDate(metadata.created_at))
    );
    setObservations(
      maybeFinalResult.markers.length > 0
        ? maybeFinalResult.markers.map((marker) => mapMarkerToRow(marker))
        : [{ ...initialObservation, id: generateId() }]
    );
    setHasPrefilled(true);
  }, [hasPrefilled, isDone, metadata, uuid]);

  useEffect(() => {
    if (!uuid || !isDone) {
      setIsPdfLoading(false);
      setPdfLoadFailed(false);
      setPdfErrorMessage(null);
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = null;
      }
      setPdfObjectUrl(null);
      return;
    }

    const controller = new AbortController();
    const fetchPdf = async () => {
      setIsPdfLoading(true);
      setPdfLoadFailed(false);
      setPdfErrorMessage(null);
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = null;
      }
      setPdfObjectUrl(null);

      try {
        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
        const response = await fetch(`${apiBaseUrl}/documents/${uuid}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/pdf',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF (${response.status})`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('pdf')) {
          throw new Error(`Unexpected content type: ${contentType || 'unknown'}`);
        }

        const pdfBytes = new Uint8Array(await response.arrayBuffer());
        if (pdfBytes.length === 0) {
          throw new Error('Empty PDF response');
        }
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(pdfBlob);
        pdfObjectUrlRef.current = objectUrl;
        setPdfObjectUrl(objectUrl);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setPdfLoadFailed(true);
        setPdfObjectUrl(null);
        setPdfErrorMessage(error instanceof Error ? error.message : 'Unknown PDF error');
      } finally {
        if (!controller.signal.aborted) {
          setIsPdfLoading(false);
        }
      }
    };

    fetchPdf();
    return () => {
      controller.abort();
    };
  }, [isDone, uuid]);

  useEffect(() => {
    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current);
        pdfObjectUrlRef.current = null;
      }
    };
  }, []);

  if (!uuid) {
    return (
      <MainLayout>
        <PageContainer size="xl">
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center text-destructive">
              {t('documents.details.missingId')}
            </CardContent>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  if (metadataQuery.isLoading) {
    return (
      <MainLayout>
        <PageContainer size="xl">
          <Card>
            <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
              {t('common.loading')}
            </CardContent>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  if (metadataQuery.isError || !metadata) {
    return (
      <MainLayout>
        <PageContainer size="xl">
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center text-destructive">
              {metadataQuery.error instanceof Error
                ? metadataQuery.error.message
                : t('documents.details.errorLoad')}
            </CardContent>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer size="xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button
              variant="ghost"
              className="mb-2 gap-2 text-muted-foreground"
              onClick={() => navigate('/documents')}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('documents.details.backToList')}
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{t('documents.details.title')}</h1>
          </div>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            {deleteMutation.isPending
              ? t('documents.details.deleting')
              : t('documents.details.delete')}
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="grid gap-4 py-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('documents.details.uuid')}</p>
              <p className="font-mono text-sm">{metadata.uuid}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('documents.details.createdAt')}</p>
              <p>{formatDate(metadata.created_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('documents.details.fileSize')}</p>
              <p>{formatSize(metadata.file_size_bytes)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('documents.details.status')}</p>
              <Badge variant={statusVariant(documentStatus)}>
                {statusLabel(documentStatus, t)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {isFailed && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle>{t('documents.details.failedTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {metadata.error_message || t('documents.details.failedFallback')}
              </p>
            </CardContent>
          </Card>
        )}

        {isPendingOrProcessing && (
          <Card>
            <CardContent className="py-6 text-muted-foreground">
              {t('documents.details.processingMessage')}
            </CardContent>
          </Card>
        )}

        {isDone && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('documents.details.formTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="report-title">{t('documents.details.reportTitle')}</Label>
                    <Input
                      id="report-title"
                      value={title}
                      onChange={(event) => {
                        setTitle(event.target.value);
                        setTitleError(null);
                      }}
                      placeholder={t('documents.details.reportTitlePlaceholder')}
                      aria-invalid={!!titleError}
                      className={cn(titleError && 'border-destructive')}
                    />
                    {titleError && <p className="text-sm text-destructive">{titleError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="report-notes">{t('documents.details.reportNotes')}</Label>
                    <Textarea
                      id="report-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder={t('documents.details.reportNotesPlaceholder')}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t('documents.details.formHint')}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={addObservation}
                      disabled={isSavingReport}
                    >
                      <Plus className="h-4 w-4" />
                      {t('documents.details.addRow')}
                    </Button>
                  </div>

                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">{t('documents.details.colName')}</TableHead>
                          <TableHead className="min-w-[150px]">{t('documents.details.colType')}</TableHead>
                          <TableHead className="min-w-[130px]">{t('documents.details.colCode')}</TableHead>
                          <TableHead className="min-w-[110px]">{t('documents.details.colValue')}</TableHead>
                          {showNumericColumns && (
                            <>
                              <TableHead className="min-w-[90px]">{t('documents.details.colUnit')}</TableHead>
                              <TableHead className="min-w-[90px]">{t('documents.details.colRefMin')}</TableHead>
                              <TableHead className="min-w-[90px]">{t('documents.details.colRefMax')}</TableHead>
                              <TableHead className="min-w-[90px]">{t('documents.details.colRefUnit')}</TableHead>
                            </>
                          )}
                          <TableHead className="w-[50px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {observations.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <Input
                                value={row.name}
                                onChange={(event) =>
                                  updateObservation(row.id, 'name', event.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={row.valueType || 'numeric'}
                                onValueChange={(nextType) =>
                                  updateObservationType(row.id, nextType as ObservationValueType)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {markerTypeOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {t(`documents.details.markerTypeOptions.${option}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={row.code}
                                onChange={(event) =>
                                  updateObservation(row.id, 'code', event.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {row.valueType === 'boolean' ? (
                                <Select
                                  value={row.value.toLowerCase()}
                                  onValueChange={(nextValue) =>
                                    updateObservation(row.id, 'value', nextValue)
                                  }
                                >
                                  <SelectTrigger
                                    aria-invalid={invalidValueRowIds.includes(row.id)}
                                    className={cn(
                                      invalidValueRowIds.includes(row.id) && 'border-destructive'
                                    )}
                                  >
                                    <SelectValue placeholder={t('documents.details.booleanValuePlaceholder')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="true">
                                      {t('documents.details.booleanValueOptions.positive')}
                                    </SelectItem>
                                    <SelectItem value="false">
                                      {t('documents.details.booleanValueOptions.negative')}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={row.value}
                                  onChange={(event) =>
                                    updateObservation(row.id, 'value', event.target.value)
                                  }
                                  aria-invalid={invalidValueRowIds.includes(row.id)}
                                  className={cn(
                                    invalidValueRowIds.includes(row.id) && 'border-destructive'
                                  )}
                                />
                              )}
                            </TableCell>
                            {showNumericColumns && (
                              <>
                                <TableCell>
                                  {row.valueType === 'numeric' ? (
                                    <Input
                                      value={row.unit}
                                      onChange={(event) =>
                                        updateObservation(row.id, 'unit', event.target.value)
                                      }
                                      aria-invalid={invalidUnitRowIds.includes(row.id)}
                                      className={cn(
                                        invalidUnitRowIds.includes(row.id) && 'border-destructive'
                                      )}
                                    />
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.valueType === 'numeric' ? (
                                    <Input
                                      value={row.referenceRangeMin}
                                      onChange={(event) =>
                                        updateObservation(
                                          row.id,
                                          'referenceRangeMin',
                                          event.target.value
                                        )
                                      }
                                      aria-invalid={invalidReferenceRowIds.includes(row.id)}
                                      className={cn(
                                        invalidReferenceRowIds.includes(row.id) && 'border-destructive'
                                      )}
                                    />
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.valueType === 'numeric' ? (
                                    <Input
                                      value={row.referenceRangeMax}
                                      onChange={(event) =>
                                        updateObservation(
                                          row.id,
                                          'referenceRangeMax',
                                          event.target.value
                                        )
                                      }
                                      aria-invalid={invalidReferenceRowIds.includes(row.id)}
                                      className={cn(
                                        invalidReferenceRowIds.includes(row.id) && 'border-destructive'
                                      )}
                                    />
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {row.valueType === 'numeric' ? (
                                    <Input
                                      value={row.referenceUnit}
                                      onChange={(event) =>
                                        updateObservation(row.id, 'referenceUnit', event.target.value)
                                      }
                                      aria-invalid={invalidReferenceRowIds.includes(row.id)}
                                      className={cn(
                                        invalidReferenceRowIds.includes(row.id) && 'border-destructive'
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
                                disabled={observations.length <= 1 || isSavingReport}
                                onClick={() => removeObservation(row.id)}
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

                  <p className="text-sm text-muted-foreground">
                    {t('documents.details.numericOnlyNotice')}
                  </p>
                  {rowsError && <p className="text-sm text-destructive">{rowsError}</p>}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingReport}>
                      {isSavingReport ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('documents.details.saving')}
                        </>
                      ) : (
                        t('documents.details.save')
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{t('documents.details.previewTitle')}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setZoom((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(1))))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[56px] text-center text-sm text-muted-foreground">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setZoom((prev) => Math.min(2.5, Number((prev + 0.1).toFixed(1))))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setZoom(1)}>
                      {t('documents.details.zoomReset')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/20 p-3">
                  {isPdfLoading && (
                    <p className="text-sm text-muted-foreground">{t('documents.details.previewLoading')}</p>
                  )}

                  {!isPdfLoading && (pdfLoadFailed || !pdfObjectUrl) && (
                    <p className="text-sm text-destructive">
                      {pdfErrorMessage
                        ? `${t('documents.details.previewError')} (${pdfErrorMessage})`
                        : t('documents.details.previewError')}
                    </p>
                  )}

                  {!isPdfLoading && !pdfLoadFailed && pdfObjectUrl && (
                    <div className="overflow-auto">
                      <iframe
                        title={t('documents.details.previewTitle')}
                        src={pdfObjectUrl}
                        className="border-0"
                        style={{
                          width: `${100 / zoom}%`,
                          minHeight: `${Math.round(70 / zoom)}vh`,
                          transform: `scale(${zoom})`,
                          transformOrigin: 'top left',
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('documents.details.deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('documents.details.deleteConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('documents.details.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </MainLayout>
  );
}
