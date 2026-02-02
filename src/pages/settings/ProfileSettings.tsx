import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { accountService, ApiClientError } from '@/api';
import { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from '@/types';

const profileSchema = z.object({
  nickname: z.string().max(255).optional().nullable(),
  language: z.string().min(2).max(2),
  timezone: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { t } = useTranslation();
  const { account, refreshAccount } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: account?.nickname || '',
      language: account?.language || 'en',
      timezone: account?.timezone || 'UTC',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      await accountService.updateAccount({
        nickname: data.nickname || null,
        language: data.language,
        timezone: data.timezone,
      });

      await refreshAccount();
      
      toast({
        title: t('common.success'),
        description: t('settings.profile.saved'),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isValidationError()) {
          const fieldErrors = error.getFieldErrors();
          Object.keys(fieldErrors).forEach((field) => {
            setError(field as keyof ProfileFormData, {
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
          description: 'An unexpected error occurred',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.profile.title')}</CardTitle>
          <CardDescription>{t('settings.profile.subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Read-only fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Sex</Label>
                <Input
                  value={account?.sex === 'male' ? 'Male' : 'Female'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Date of Birth</Label>
                <Input
                  value={account?.date_of_birth || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-2">
              <Label htmlFor="nickname">{t('accountSetup.nickname.label')}</Label>
              <Input
                id="nickname"
                placeholder={t('accountSetup.nickname.placeholder')}
                {...register('nickname')}
              />
              {errors.nickname && (
                <p className="text-sm text-destructive">
                  {errors.nickname.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('accountSetup.language.label')}</Label>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.language && (
                  <p className="text-sm text-destructive">
                    {errors.language.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('accountSetup.timezone.label')}</Label>
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.timezone && (
                  <p className="text-sm text-destructive">
                    {errors.timezone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !isDirty}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
