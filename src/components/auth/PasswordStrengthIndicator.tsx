import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
}

function calculatePasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: '' };
  }

  let score = 0;
  const checks = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    veryLong: password.length >= 16,
  };

  if (checks.length) score += 20;
  if (checks.lowercase) score += 15;
  if (checks.uppercase) score += 15;
  if (checks.number) score += 20;
  if (checks.special) score += 20;
  if (checks.veryLong) score += 10;

  if (score < 35) {
    return { score, label: 'Weak', color: 'bg-destructive' };
  }
  if (score < 55) {
    return { score, label: 'Fair', color: 'bg-warning' };
  }
  if (score < 75) {
    return { score, label: 'Good', color: 'bg-primary' };
  }
  return { score, label: 'Strong', color: 'bg-success' };
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <Progress
        value={strength.score}
        className={cn('h-1.5', strength.color)}
      />
      <p
        className={cn(
          'text-xs font-medium',
          strength.score < 35 && 'text-destructive',
          strength.score >= 35 && strength.score < 55 && 'text-warning',
          strength.score >= 55 && strength.score < 75 && 'text-primary',
          strength.score >= 75 && 'text-success'
        )}
      >
        {strength.label}
      </p>
    </div>
  );
}
