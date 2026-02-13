import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertTriangle } from 'lucide-react';

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, ApiClientError } from '@/api';

const deleteSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type DeleteFormData = z.infer<typeof deleteSchema>;

export default function DangerZone() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingPassword, setPendingPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DeleteFormData>({
    resolver: zodResolver(deleteSchema),
    mode: 'onChange',
  });

  const onSubmit = (data: DeleteFormData) => {
    setPendingPassword(data.password);
    setShowConfirmDialog(true);
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      await profileService.deleteUser(pendingPassword);

      toast({
        title: t('common.success'),
        description: t('settings.dangerZone.deleteAccount.success'),
      });

      await logout();
      navigate('/');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isValidationError()) {
          toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.getFirstError(),
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
      setPendingPassword('');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">
                {t('settings.dangerZone.deleteAccount.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.dangerZone.deleteAccount.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">
                {t('settings.dangerZone.deleteAccount.warning')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {t('settings.dangerZone.deleteAccount.confirmLabel')}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('settings.dangerZone.deleteAccount.confirmPlaceholder')}
                {...register('password')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.dangerZone.deleteAccount.submit')}
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('settings.dangerZone.deleteAccount.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.dangerZone.deleteAccount.confirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('settings.dangerZone.deleteAccount.submit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
