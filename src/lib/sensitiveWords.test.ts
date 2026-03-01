import { describe, expect, it } from 'vitest';

import { sanitizeSensitiveWordsInput } from '@/lib/sensitiveWords';

describe('sanitizeSensitiveWordsInput', () => {
  it('normalizes separators and keeps only letters, digits, apostrophe to match backend regex', () => {
    const input = 'ivan,\n shevchenko; kyiv...1990';
    expect(sanitizeSensitiveWordsInput(input)).toBe('ivan shevchenko kyiv 1990');
  });

  it('preserves apostrophes inside words (backend allows a-zA-Z0-9\')', () => {
    const input = "O'Connor, D'Artagnan";
    expect(sanitizeSensitiveWordsInput(input)).toBe("o'connor d'artagnan");
  });

  it('removes apostrophes that are not part of words', () => {
    const input = "'ivan' '' shevchenko";
    expect(sanitizeSensitiveWordsInput(input)).toBe('ivan shevchenko');
  });

  it('transliterates and strips diacritics', () => {
    const input = 'José Łódź';
    expect(sanitizeSensitiveWordsInput(input)).toBe('jose lodz');
  });

  it('removes duplicate words and keeps unique ones', () => {
    const input = 'ivan ivan shevchenko kyiv ivan shevchenko';
    expect(sanitizeSensitiveWordsInput(input)).toBe('ivan shevchenko kyiv');
  });
});
