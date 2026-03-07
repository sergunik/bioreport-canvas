import { useCallback, useId, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileUp, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { documentService, ApiClientError } from '@/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PDF_MIME = 'application/pdf';
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

function validateFile(file: File): string | null {
  if (file.type !== PDF_MIME) {
    return 'documents.upload.validationWrongType';
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'documents.upload.validationTooLarge';
  }
  return null;
}

export interface DocumentUploadCardProps {
  onSuccess?: () => void;
}

export default function DocumentUploadCard({ onSuccess }: DocumentUploadCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      if (isUploading) return;
      const errorKey = validateFile(file);
      if (errorKey) {
        toast.error(t(errorKey));
        return;
      }
      setIsUploading(true);
      try {
        await documentService.upload(file);
        toast.success(t('documents.upload.success'));
        await queryClient.invalidateQueries({ queryKey: ['documents'] });
        onSuccess?.();
      } catch (err) {
        if (err instanceof ApiClientError) {
          if (err.isValidationError()) {
            const first = err.getFirstError();
            toast.error(first || t('common.error'));
          } else {
            toast.error(err.message);
          }
        } else {
          toast.error(t('documents.upload.errorGeneric'));
        }
      } finally {
        setIsUploading(false);
      }
    },
    [isUploading, onSuccess, queryClient, t]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onSelectFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      e.target.value = '';
    },
    [handleUpload]
  );

  return (
    <Card
      className={cn(
        'border-2 border-dashed transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      )}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <p className="mt-6 text-lg font-medium text-foreground">
          {t('documents.upload.dropText')}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('documents.upload.hint')}
        </p>
        <div className="mt-6">
          <Button
            variant="secondary"
            className="gap-2"
            disabled={isUploading}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <FileUp className="h-4 w-4" />
            {isUploading ? t('common.loading') : t('documents.upload.selectFile')}
          </Button>
          <input
            id={inputId}
            type="file"
            accept={PDF_MIME}
            className="sr-only"
            onChange={onSelectFile}
            disabled={isUploading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
