import { describe, expect, it } from 'vitest';

import { sanitizeSensitiveWordsInput } from '@/lib/sensitiveWords';

describe('sanitizeSensitiveWordsInput', () => {
  it('normalizes separators and keeps letters (including Cyrillic), digits, apostrophe', () => {
    const input = 'ivan,\n shevchenko; kyiv...1990';
    expect(sanitizeSensitiveWordsInput(input)).toBe('ivan shevchenko kyiv 1990');
  });

  it('preserves apostrophes inside words', () => {
    const input = "O'Connor, D'Artagnan";
    expect(sanitizeSensitiveWordsInput(input)).toBe("o'connor d'artagnan");
  });

  it('removes apostrophes that are not part of words', () => {
    const input = "'ivan' '' shevchenko";
    expect(sanitizeSensitiveWordsInput(input)).toBe('ivan shevchenko');
  });

  it('keeps Cyrillic and only lowercases and normalizes separators', () => {
    const input = 'Топольський Андрій Антонович';
    expect(sanitizeSensitiveWordsInput(input)).toBe('топольський андрій антонович');
  });

  it('removes duplicate words and keeps unique ones', () => {
    const input = 'ivan ivan shevchenko kyiv ivan shevchenko';
    expect(sanitizeSensitiveWordsInput(input)).toBe('ivan shevchenko kyiv');
  });

  it('handles empty string input', () => {
    expect(sanitizeSensitiveWordsInput('')).toBe('');
  });

  it('handles whitespace-only input', () => {
    expect(sanitizeSensitiveWordsInput('   \n\t  ')).toBe('');
  });

  it('handles numeric-only input', () => {
    expect(sanitizeSensitiveWordsInput('12345 67890')).toBe('12345 67890');
  });
});
