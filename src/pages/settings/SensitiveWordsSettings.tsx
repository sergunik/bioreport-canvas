import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ShieldCheck } from 'lucide-react';

import { accountService, ApiClientError } from '@/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sanitizeSensitiveWordsInput } from '@/lib/sensitiveWords';
import FormErrorText from '@/pages/settings/components/FormErrorText';
import SettingsSectionCard from '@/pages/settings/components/SettingsSectionCard';

const sensitiveWordsSchema = z.object({
  sensitive_words: z.string().max(50000),
});

type SensitiveWordsFormData = z.infer<typeof sensitiveWordsSchema>;

export default function SensitiveWordsSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    reset,
  } = useForm<SensitiveWordsFormData>({
    resolver: zodResolver(sensitiveWordsSchema),
    defaultValues: {
      sensitive_words: '',
    },
  });

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const account = await accountService.getAccount();
        reset({ sensitive_words: account.sensitive_words || '' });
      } catch (error) {
        if (error instanceof ApiClientError) {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.message,
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: t('settings.sensitiveWords.errors.load'),
          });
        }
      } finally {
        setIsFetching(false);
      }
    };

    loadAccount();
  }, [reset, t, toast]);

  const onSubmit = async (data: SensitiveWordsFormData) => {
    setIsLoading(true);

    const sanitizedSensitiveWords = sanitizeSensitiveWordsInput(data.sensitive_words);

    try {
      await accountService.updateAccount({
        sensitive_words: sanitizedSensitiveWords || null,
      });

      reset({ sensitive_words: sanitizedSensitiveWords });

      toast({
        title: t('common.success'),
        description: t('settings.sensitiveWords.saved'),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isValidationError()) {
          const fieldErrors = error.getFieldErrors();
          Object.keys(fieldErrors).forEach((field) => {
            setError(field as keyof SensitiveWordsFormData, {
              message: fieldErrors[field][0],
            });
          });
        } else {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.message,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('settings.sensitiveWords.errors.save'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsSectionCard
        title={t('settings.sensitiveWords.title')}
        description={t('settings.sensitiveWords.description')}
        icon={ShieldCheck}
        iconClassName="bg-secondary text-secondary-foreground"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sensitive-words">{t('settings.sensitiveWords.fieldLabel')}</Label>
            <Textarea
              id="sensitive-words"
              className="min-h-[240px]"
              placeholder={t('settings.sensitiveWords.placeholder')}
              {...register('sensitive_words')}
              aria-invalid={!!errors.sensitive_words}
            />
            <FormErrorText message={errors.sensitive_words?.message} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !isDirty}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </div>
      </SettingsSectionCard>
    </form>
  );
}
