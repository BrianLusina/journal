/**
 * The camel casing is intentional on the variable names to ensure that
 * on the call site, the format is known
 */

export const DATE_FORMAT_YYYY_MM_DD = 'YYYY-MM-DD';
export const DATE_FORMAT_MMMM_D_YYYY = 'MMMM D, YYYY';
export const TIME_FORMAT_HH_MM = 'HH:mm';
export const TIME_FORMAT_HH_MM_A = 'h:mm a';
// eslint-disable-next-line camelcase
export const DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss = 'YYYY-MM-DD hh:mm:ss';

// eslint-disable-next-line camelcase
export const DATE_TIME_FORMAT_MMMM_D_ha = 'MMMM, D | ha';
export const DEFAULT_DATE_TIME_FORMAT = `${DATE_FORMAT_YYYY_MM_DD} ${TIME_FORMAT_HH_MM}`;

export const DEFAULT_DATE_FORMAT = DATE_FORMAT_YYYY_MM_DD;
export const DEFAULT_TIME_FORMAT = TIME_FORMAT_HH_MM;
export const DEFAULT_DATE_TIME_FORMAT_WITH_SECONDS = `${DATE_FORMAT_YYYY_MM_DD} ${TIME_FORMAT_HH_MM}:ss`;
export const DEFAULT_DATE_TIME_FORMAT_WITH_MILLISECONDS = `${DATE_FORMAT_YYYY_MM_DD} ${TIME_FORMAT_HH_MM}:ss.SSS`;
export const DEFAULT_DATE_TIME_FORMAT_WITH_MILLISECONDS_AND_Z = `${DATE_FORMAT_YYYY_MM_DD} ${TIME_FORMAT_HH_MM}:ss.SSSZ`;
export const DEFAULT_DATE_TIME_FORMAT_WITH_MILLISECONDS_AND_Z_AND_T = `${DATE_FORMAT_YYYY_MM_DD} ${TIME_FORMAT_HH_MM}:ss.SSSZT`;
