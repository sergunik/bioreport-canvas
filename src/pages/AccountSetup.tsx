import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Loader2, CalendarIcon } from 'lucide-react';

import { AuthLayout } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { LANGUAGE_OPTIONS, TIMEZONE_OPTIONS, type Sex } from '@/types';
import { cn } from '@/lib/utils';

const accountSetupSchema = z.object({
  sex: z.enum(['male', 'female'], {
    required_error: 'Please select your sex',
  }),
  date_of_birth: z.date({
    required_error: 'Please select your date of birth',
  }),
  nickname: z.string().max(255).optional().nullable(),
  language: z.string().min(2).max(2).default('en'),
  timezone: z.string().default('UTC'),
});

type AccountSetupFormData = z.infer<typeof accountSetupSchema>;

export default function AccountSetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAccount } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<AccountSetupFormData>({
    resolver: zodResolver(accountSetupSchema),
    defaultValues: {
      language: 'en',
      timezone: 'UTC',
    },
  });

  const selectedSex = watch('sex');

  const onSubmit = async (data: AccountSetupFormData) => {
    setIsLoading(true);

    try {
      const account = await accountService.createAccount({
        sex: data.sex as Sex,
        date_of_birth: format(data.date_of_birth, 'yyyy-MM-dd'),
        nickname: data.nickname || null,
        language: data.language,
        timezone: data.timezone,
      });

      setAccount(account);
      toast({
        title: t('common.success'),
        description: 'Your account has been set up successfully.',
      });
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.isValidationError()) {
          const fieldErrors = error.getFieldErrors();
          Object.keys(fieldErrors).forEach((field) => {
            setError(field as keyof AccountSetupFormData, {
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
      <Card className="w-full max-w-lg shadow-soft">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            {t('accountSetup.title')}
          </CardTitle>
          <CardDescription>{t('accountSetup.subtitle')}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Sex Selection */}
            <div className="space-y-3">
              <Label>{t('accountSetup.sex.label')}</Label>
              <Controller
                name="sex"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={field.value === 'male' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => field.onChange('male')}
                    >
                      {t('accountSetup.sex.male')}
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === 'female' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => field.onChange('female')}
                    >
                      {t('accountSetup.sex.female')}
                    </Button>
                  </div>
                )}
              />
              {errors.sex && (
                <p className="text-sm text-destructive">{errors.sex.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label>{t('accountSetup.dateOfBirth.label')}</Label>
              <Controller
                name="date_of_birth"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>{t('accountSetup.dateOfBirth.placeholder')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                        className="pointer-events-auto"
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date_of_birth && (
                <p className="text-sm text-destructive">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>

            {/* Nickname */}
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

            {/* Language */}
            <div className="space-y-2">
              <Label>{t('accountSetup.language.label')}</Label>
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('accountSetup.language.placeholder')}
                      />
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

            {/* Timezone */}
            <div className="space-y-2">
              <Label>{t('accountSetup.timezone.label')}</Label>
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('accountSetup.timezone.placeholder')}
                      />
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
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('accountSetup.submit')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}
