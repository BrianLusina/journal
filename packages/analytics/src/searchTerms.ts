/** GA4 truncates parameter values past 100 characters. */
const MAX_TERM_LENGTH = 100;

/** Trimmed, lowercased, with whitespace collapsed, and cut to the length GA4 keeps. */
export const normalizeSearchTerm = (term: string): string =>
  term.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_TERM_LENGTH);

const EMAIL = /\S+@\S+\.\S+/;
// Seven digits or more, once spaces and punctuation are removed: a phone, card or account number.
const LONG_NUMBER = /\d{7,}/;

/** Whether a term may be personal data, which Google Analytics terms forbid sending. */
export const mayBePersonal = (term: string): boolean =>
  EMAIL.test(term) || LONG_NUMBER.test(term.replace(/[\s().,/+-]/g, ''));
