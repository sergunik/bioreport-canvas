import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import FormErrorText from './components/FormErrorText';
import SettingsSectionCard from './components/SettingsSectionCard';

const deleteSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type DeleteFormData = z.infer<typeof deleteSchema>;

export default function DangerZoneSection() {
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <SettingsSectionCard
          title={t('settings.dangerZone.deleteAccount.title')}
          description={t('settings.dangerZone.deleteAccount.description')}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
          cardClassName="border-destructive/20"
        >
          <div className="space-y-4">
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
              <FormErrorText message={errors.password?.message} />
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
          </div>
        </SettingsSectionCard>
      </form>

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
