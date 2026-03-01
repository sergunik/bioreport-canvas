import { transliterate as transliterateToLatin } from 'transliteration';

const DEFAULT_SEPARATOR_REGEX = /[^a-z0-9']+/g;
const EDGE_APOSTROPHE_REGEX = /^'+|'+$/g;
const DIACRITICS_REGEX = /\p{M}+/gu;
const UNICODE_APOSTROPHES_REGEX = /[\u2018\u2019\u02BC\u0060\u00B4]/g;

type IntlTransliterator = {
  transliterate: (value: string) => string;
};

type IntlWithTransliterator = typeof Intl & {
  Transliterator?: new (id: string) => IntlTransliterator;
};

function transliterateWithIcu(input: string): string | null {
  const intl = Intl as IntlWithTransliterator;

  if (!intl.Transliterator) {
    return null;
  }

  try {
    const transliterator = new intl.Transliterator('Any-Latin; Latin-ASCII; Lower()');
    return transliterator.transliterate(input);
  } catch {
    return null;
  }
}

export function sanitizeSensitiveWordsInput(input: string): string {
  const icuResult = transliterateWithIcu(input);
  const transliterated = (icuResult ?? transliterateToLatin(input)).toLowerCase();

  const normalized = transliterated
    .replace(UNICODE_APOSTROPHES_REGEX, "'")
    .normalize('NFKD')
    .replace(DIACRITICS_REGEX, '');

  const words = normalized
    .split(DEFAULT_SEPARATOR_REGEX)
    .map((token) => token.replace(EDGE_APOSTROPHE_REGEX, '').replace(/[^a-zA-Z0-9']/g, ''))
    .filter(Boolean);

  return [...new Set(words)].join(' ');
}
