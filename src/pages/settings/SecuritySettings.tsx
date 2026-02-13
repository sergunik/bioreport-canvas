import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock } from 'lucide-react';

import { PasswordStrengthIndicator } from '@/components/auth';
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
import { useToast } from '@/hooks/use-toast';
import { securityService, ApiClientError } from '@/api';

// ── Change Email ──

const changeEmailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  current_password: z.string().min(1, 'Current password is required'),
});

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

// ── Change Password ──

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(12, 'Password must be at least 12 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function SecuritySettings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <ChangeEmailCard />
      <ChangePasswordCard />
    </div>
  );
}

// ── Change Email Card ──

function ChangeEmailCard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
  });

  const onSubmit = async (data: ChangeEmailFormData) => {
    setIsLoading(true);

    try {
      await securityService.updateSecurity({
        current_password: data.current_password,
        email: data.email,
      });

      toast({
        title: t('common.success'),
        description: t('settings.security.changeEmail.success'),
      });

      reset();
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Mail className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <CardTitle>{t('settings.security.changeEmail.title')}</CardTitle>
            <CardDescription>
              {t('settings.security.changeEmail.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {t('settings.security.changeEmail.newEmail')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="new@example.com"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-current-password">
              {t('settings.security.changeEmail.currentPassword')}
            </Label>
            <Input
              id="email-current-password"
              type="password"
              autoComplete="current-password"
              {...register('current_password')}
              aria-invalid={!!errors.current_password}
            />
            {errors.current_password && (
              <p className="text-sm text-destructive">
                {errors.current_password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.security.changeEmail.submit')}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

// ── Change Password Card ──

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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <Lock className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <CardTitle>{t('settings.security.changePassword.title')}</CardTitle>
            <CardDescription>
              {t('settings.security.changePassword.description')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
            {errors.current_password && (
              <p className="text-sm text-destructive">
                {errors.current_password.message}
              </p>
            )}
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
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t('settings.security.changePassword.confirmPassword')}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.security.changePassword.submit')}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
