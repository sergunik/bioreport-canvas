const SEPARATOR_REGEX = /[^\p{L}\p{N}']+/gu;
const EDGE_APOSTROPHE_REGEX = /^'+|'+$/g;
const UNICODE_APOSTROPHES_REGEX = /[\u2018\u2019\u02BC\u0060\u00B4]/g;

export function sanitizeSensitiveWordsInput(input: string): string {
  const normalized = input
    .replace(UNICODE_APOSTROPHES_REGEX, "'")
    .toLowerCase();

  const words = normalized
    .split(SEPARATOR_REGEX)
    .map((token) => token.replace(EDGE_APOSTROPHE_REGEX, '').replace(/[^\p{L}\p{N}']/gu, ''))
    .filter(Boolean);

  return [...new Set(words)].join(' ');
}
