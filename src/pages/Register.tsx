import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

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
import { useAuth } from '@/contexts/AuthContext';
import { ApiClientError } from '@/api';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      await registerUser(data.email, data.password);
      navigate('/account-setup');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isValidationError()) {
          const fieldErrors = error.getFieldErrors();
          Object.keys(fieldErrors).forEach((field) => {
            setError(field as keyof RegisterFormData, {
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
    <AuthLayout>
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            {t('auth.register.title')}
          </CardTitle>
          <CardDescription>{t('auth.register.subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.register.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.register.password')}</Label>
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
              <p className="text-xs text-muted-foreground">
                {t('auth.register.passwordHint')}
              </p>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.register.submit')}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.register.login')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
