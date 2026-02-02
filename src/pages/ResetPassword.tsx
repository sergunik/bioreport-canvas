import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

import { AuthLayout, PasswordStrengthIndicator } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authService, ApiClientError } from '@/api';

const resetPasswordSchema = z
  .object({
    password: z.string().min(12, 'Password must be at least 12 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setIsInvalidToken(true);
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);

    try {
      await authService.resetPassword({
        token,
        password: data.password,
      });
      setIsSuccess(true);

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 400) {
          setIsInvalidToken(true);
        } else if (error.isValidationError()) {
          const fieldErrors = error.getFieldErrors();
          Object.keys(fieldErrors).forEach((field) => {
            if (field === 'password') {
              setError('password', { message: fieldErrors[field][0] });
            }
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

  if (isInvalidToken) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth.resetPassword.invalidToken')}
            </CardDescription>
          </CardHeader>

          <CardFooter className="flex flex-col gap-3">
            <Link to="/forgot-password" className="w-full">
              <Button className="w-full">Request a new reset link</Button>
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('auth.resetPassword.backToLogin')}
            </Link>
          </CardFooter>
        </Card>
      </AuthLayout>
    );
  }

  if (isSuccess) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <CardTitle className="text-2xl font-semibold">
              Password Reset Successful
            </CardTitle>
            <CardDescription className="text-base">
              {t('auth.resetPassword.success')} Redirecting to login...
            </CardDescription>
          </CardHeader>

          <CardFooter>
            <Link to="/login" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.resetPassword.backToLogin')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            {t('auth.resetPassword.title')}
          </CardTitle>
          <CardDescription>{t('auth.resetPassword.subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.resetPassword.password')}</Label>
              <Input
                id="password"
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
                {t('auth.resetPassword.confirmPassword')}
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
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.resetPassword.submit')}
            </Button>

            <Link
              to="/login"
              className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('auth.resetPassword.backToLogin')}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
