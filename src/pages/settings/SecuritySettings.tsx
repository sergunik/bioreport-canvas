import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Monitor, Smartphone, Globe, Clock } from 'lucide-react';

import { PasswordStrengthIndicator } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(12, 'Password must be at least 12 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Mock session data
const mockSessions = [
  {
    id: '1',
    device: 'Chrome on MacOS',
    icon: Monitor,
    location: 'San Francisco, CA',
    lastActive: 'Now',
    isCurrent: true,
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    icon: Smartphone,
    location: 'San Francisco, CA',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
];

export default function SecuritySettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);

    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: t('common.success'),
      description: t('settings.security.changePassword.success'),
    });

    reset();
    setPasswordValue('');
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.security.changePassword.title')}</CardTitle>
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
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {errors.currentPassword.message}
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
                {...register('newPassword', {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
              />
              <PasswordStrengthIndicator password={passwordValue} />
              {errors.newPassword && (
                <p className="text-sm text-destructive">
                  {errors.newPassword.message}
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

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.security.sessions.title')}</CardTitle>
          <CardDescription>
            {t('settings.security.sessions.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <session.icon className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.device}</p>
                    {session.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        {t('settings.security.sessions.current')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.lastActive}
                    </span>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <Button variant="outline" size="sm">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.security.twoFactor.title')}</CardTitle>
              <CardDescription>
                {t('settings.security.twoFactor.description')}
              </CardDescription>
            </div>
            <Badge variant="secondary">{t('common.comingSoon')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button disabled variant="outline">
            Enable 2FA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
