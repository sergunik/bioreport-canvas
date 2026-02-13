import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock } from 'lucide-react';

import { PasswordStrengthIndicator } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { profileService, securityService, ApiClientError } from '@/api';
import FormErrorText from './components/FormErrorText';
import SettingsSectionCard from './components/SettingsSectionCard';

const changeEmailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function SecuritySettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <ChangeEmailCard />
      <ChangePasswordCard />
    </div>
  );
}

function ChangeEmailCard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        reset({ email: profile.email ?? '' });
      } catch {
        reset({ email: '' });
      } finally {
        setIsFetching(false);
      }
    };
    loadProfile();
  }, [reset]);

  const onSubmit = async (data: ChangeEmailFormData) => {
    setIsLoading(true);

    try {
      await securityService.updateSecurity({ email: data.email });

      toast({
        title: t('common.success'),
        description: t('settings.security.changeEmail.success'),
      });

      const profile = await profileService.getProfile();
      reset({ email: profile.email ?? '' });
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isValidationError()) {
          const fieldErrors = error.getFieldErrors();
          Object.keys(fieldErrors).forEach((field) => {
            setError(field as keyof ChangeEmailFormData, {
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsSectionCard
        title={t('settings.security.changeEmail.title')}
        description={t('settings.security.changeEmail.description')}
        icon={Mail}
        iconClassName="bg-secondary text-secondary-foreground"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {t('settings.security.changeEmail.newEmail')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="new@example.com"
              disabled={isFetching}
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            <FormErrorText message={errors.email?.message} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || isFetching}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.security.changeEmail.submit')}
            </Button>
          </div>
        </div>
      </SettingsSectionCard>
    </form>
  );
}

function ChangePasswordCard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);

    try {
      await securityService.updateSecurity({
        current_password: data.current_password,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      toast({
        title: t('common.success'),
        description: t('settings.security.changePassword.success'),
      });

      reset();
      setPasswordValue('');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isValidationError()) {
          const fieldErrors = error.getFieldErrors();
          Object.keys(fieldErrors).forEach((field) => {
            setError(field as keyof ChangePasswordFormData, {
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsSectionCard
        title={t('settings.security.changePassword.title')}
        description={t('settings.security.changePassword.description')}
        icon={Lock}
        iconClassName="bg-secondary text-secondary-foreground"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              {t('settings.security.changePassword.currentPassword')}
            </Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register('current_password')}
              aria-invalid={!!errors.current_password}
            />
            <FormErrorText message={errors.current_password?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t('settings.security.changePassword.newPassword')}
            </Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register('password', {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
              aria-invalid={!!errors.password}
            />
            <PasswordStrengthIndicator password={passwordValue} />
            <FormErrorText message={errors.password?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t('settings.security.changePassword.confirmPassword')}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('password_confirmation')}
              aria-invalid={!!errors.password_confirmation}
            />
            <FormErrorText message={errors.password_confirmation?.message} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.security.changePassword.submit')}
            </Button>
          </div>
        </div>
      </SettingsSectionCard>
    </form>
  );
}
