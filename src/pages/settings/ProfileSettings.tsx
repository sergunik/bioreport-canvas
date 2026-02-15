import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { profileService, ApiClientError } from '@/api';
import { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from '@/types';
import type { Profile } from '@/types/api';
import SettingsSectionCard from './components/SettingsSectionCard';
import FormErrorText from './components/FormErrorText';

const profileSchema = z.object({
  nickname: z.string().max(255).optional().nullable(),
  language: z.string().min(2).max(2),
  timezone: z.string(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: '',
      language: 'en',
      timezone: 'UTC',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
        reset({
          nickname: data.nickname || '',
          language: data.language || 'en',
          timezone: data.timezone || 'UTC',
        });
      } catch (error) {
        if (error instanceof ApiClientError) {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.message,
          });
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [reset, toast, t]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      await profileService.updateProfile({
        nickname: data.nickname || null,
        language: data.language,
        timezone: data.timezone,
      });

      const updatedProfile = await profileService.getProfile();
      setProfile(updatedProfile);
      reset({
        nickname: updatedProfile.nickname || '',
        language: updatedProfile.language || 'en',
        timezone: updatedProfile.timezone || 'UTC',
      });

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

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SettingsSectionCard
          title={t('settings.profile.title')}
          description={t('settings.profile.subtitle')}
        >
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t('settings.profile.email')}
                </Label>
                <Input
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {t('accountSetup.sex.label')}
                </Label>
                <Input
                  value={profile?.sex === 'male' ? t('accountSetup.sex.male') : t('accountSetup.sex.female')}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t('accountSetup.dateOfBirth.label')}
              </Label>
              <Input
                value={profile?.date_of_birth || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">{t('accountSetup.nickname.label')}</Label>
              <Input
                id="nickname"
                placeholder={t('accountSetup.nickname.placeholder')}
                {...register('nickname')}
              />
              <FormErrorText message={errors.nickname?.message} />
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
                <FormErrorText message={errors.language?.message} />
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
                <FormErrorText message={errors.timezone?.message} />
              </div>
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
    </div>
  );
}
