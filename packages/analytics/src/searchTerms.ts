/** GA4 truncates parameter values past 100 characters. */
const MAX_TERM_LENGTH = 100;

/** Trimmed, lowercased, with whitespace collapsed, and cut to the length GA4 keeps. */
export const normalizeSearchTerm = (term: string): string =>
  term.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_TERM_LENGTH);

/**
 * Whether a word looks like an email address: some text, an `@`, more text, a `.` and more text,
 * as /\S+@\S+\.\S+/ would match. Done without a regex, which backtracks for seconds on a long run
 * of "!@"; this is linear.
 */
const isEmailLike = (word: string): boolean => {
  const at = word.indexOf('@', 1);
  return at !== -1 && word.lastIndexOf('.', word.length - 2) >= at + 2;
};

// Seven digits or more, once spaces and punctuation are removed: a phone, card or account number.
const LONG_NUMBER = /\d{7,}/;

/** Whether a term may be personal data, which Google Analytics terms forbid sending. */
export const mayBePersonal = (term: string): boolean =>
  term.split(/\s+/).some(isEmailLike) || LONG_NUMBER.test(term.replace(/[\s().,/+-]/g, ''));
