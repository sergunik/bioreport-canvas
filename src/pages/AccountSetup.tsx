import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { AuthLayout } from '@/components/auth';
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

const MIN_BIRTH_YEAR = 1900;
const DEFAULT_BIRTH_YEAR = '2000';

const MONTH_VALUES = [
  { value: '1', key: 'dob.monthNames.january' },
  { value: '2', key: 'dob.monthNames.february' },
  { value: '3', key: 'dob.monthNames.march' },
  { value: '4', key: 'dob.monthNames.april' },
  { value: '5', key: 'dob.monthNames.may' },
  { value: '6', key: 'dob.monthNames.june' },
  { value: '7', key: 'dob.monthNames.july' },
  { value: '8', key: 'dob.monthNames.august' },
  { value: '9', key: 'dob.monthNames.september' },
  { value: '10', key: 'dob.monthNames.october' },
  { value: '11', key: 'dob.monthNames.november' },
  { value: '12', key: 'dob.monthNames.december' },
];

function createAccountSetupSchema(t: TFunction) {
  return z
    .object({
      sex: z.enum(['male', 'female'], {
        required_error: t('accountSetup.errors.sexRequired'),
      }),
      birthDay: z.string().min(1, t('accountSetup.errors.birthDayRequired')),
      birthMonth: z.string().min(1, t('accountSetup.errors.birthMonthRequired')),
      birthYear: z
        .string()
        .min(1, t('accountSetup.errors.birthYearRequired'))
        .refine((value) => {
          const numericYear = Number(value);
          const currentYear = new Date().getFullYear();
          return Number.isInteger(numericYear) && numericYear >= MIN_BIRTH_YEAR && numericYear <= currentYear;
        }, t('accountSetup.errors.birthYearInvalid')),
      nickname: z.string().max(255).optional().nullable(),
      language: z.string().min(2).max(2).default('en'),
      timezone: z.string().default('UTC'),
    })
    .superRefine((data, ctx) => {
      const day = Number(data.birthDay);
      const month = Number(data.birthMonth);
      const year = Number(data.birthYear);

      if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
        return;
      }

      const maxDayInMonth = new Date(year, month, 0).getDate();
      if (day > maxDayInMonth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['birthDay'],
          message: t('accountSetup.errors.dateOfBirthInvalid'),
        });
      }
    });
}

type AccountSetupFormData = z.infer<ReturnType<typeof createAccountSetupSchema>>;

export default function AccountSetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAccount } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const accountSetupSchema = useMemo(() => createAccountSetupSchema(t), [t]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<AccountSetupFormData>({
    resolver: zodResolver(accountSetupSchema),
    defaultValues: {
      birthDay: '1',
      birthMonth: '1',
      birthYear: DEFAULT_BIRTH_YEAR,
      language: 'en',
      timezone: 'UTC',
    },
  });

  const selectedBirthMonth = watch('birthMonth');
  const selectedBirthYear = watch('birthYear');
  const selectedBirthDay = watch('birthDay');

  const maxBirthDay = useMemo(() => {
    const month = Number(selectedBirthMonth);
    const year = Number(selectedBirthYear);
    if (!month || !year) {
      return 31;
    }

    return new Date(year, month, 0).getDate();
  }, [selectedBirthMonth, selectedBirthYear]);

  const dayOptions = useMemo(
    () => Array.from({ length: maxBirthDay }, (_, index) => String(index + 1)),
    [maxBirthDay]
  );

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from(
      { length: currentYear - MIN_BIRTH_YEAR + 1 },
      (_, index) => String(currentYear - index)
    );
  }, []);

  const monthOptions = useMemo(
    () => MONTH_VALUES.map((m) => ({ value: m.value, label: t(m.key) })),
    [t]
  );

  useEffect(() => {
    const day = Number(selectedBirthDay);
    if (day > maxBirthDay) {
      setValue('birthDay', String(maxBirthDay), { shouldValidate: true });
    }
  }, [maxBirthDay, selectedBirthDay, setValue]);

  const onSubmit = async (data: AccountSetupFormData) => {
    setIsLoading(true);

    try {
      const dateOfBirth = `${data.birthYear}-${data.birthMonth.padStart(2, '0')}-${data.birthDay.padStart(2, '0')}`;
      const account = await accountService.createAccount({
        sex: data.sex as Sex,
        date_of_birth: dateOfBirth,
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
            if (field === 'date_of_birth') {
              const message = fieldErrors[field][0];
              setError('birthDay', { message });
              setError('birthMonth', { message });
              setError('birthYear', { message });
              return;
            }

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
              <div className="grid grid-cols-3 gap-2">
                <Controller
                  name="birthDay"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.birthDay}>
                        <SelectValue placeholder={t('dob.day')} />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptions.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day.padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                <Controller
                  name="birthMonth"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.birthMonth}>
                        <SelectValue placeholder={t('dob.month')} />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                <Controller
                  name="birthYear"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={!!errors.birthYear}>
                        <SelectValue placeholder={t('dob.year')} />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {(errors.birthDay || errors.birthMonth || errors.birthYear) && (
                <p className="text-sm text-destructive">
                  {errors.birthDay?.message ||
                    errors.birthMonth?.message ||
                    errors.birthYear?.message}
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
