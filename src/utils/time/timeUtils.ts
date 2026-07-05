import { getUnixTime, formatDistance, formatDistanceStrict, formatDistanceToNow, format, parse, isValid } from 'date-fns';
// eslint-disable-next-line camelcase
import { DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss, DATE_TIME_FORMAT_MMMM_D_ha } from './constants';

/**
 * Mapping from moment.js format tokens to date-fns format tokens.
 */
const momentToDateFnsFormat = (momentFormat: string): string => {
  return momentFormat
    .replace(/YYYY/g, 'yyyy')
    .replace(/YY/g, 'yy')
    .replace(/DD/g, 'dd')
    .replace(/D/g, 'd')
    .replace(/MMMM/g, 'LLLL')
    .replace(/MMM/g, 'LLL')
    .replace(/MM/g, 'MM')
    .replace(/hh/g, 'hh')
    .replace(/HH/g, 'HH')
    .replace(/mm/g, 'mm')
    .replace(/ss/g, 'ss')
    .replace(/a/g, 'aaa');
};

const safeParse = (time: string, formatStr: string): Date => {
  const dfnsFormat = momentToDateFnsFormat(formatStr);
  const parsedDate = parse(time, dfnsFormat, new Date());
  if (isValid(parsedDate)) {
    return parsedDate;
  }
  const fallbackDate = new Date(time);
  if (isValid(fallbackDate)) {
    return fallbackDate;
  }
  return parsedDate; // Return the invalid date, it will throw RangeError later as before
};

/**
 * Gets the time in 24 hours
 * @returns {String} time in 24hour format
 */
export const getTime24Hours = (): string => {
  const now = new Date(Date.now());
  let mins: number | string = now.getMinutes();
  let hours: number | string = now.getHours();

  if (mins < 10) {
    mins = `0${mins}`;
  }

  if (hours < 10) {
    hours = `0${hours}`;
  }

  return `${hours}:${mins}`;
};

/**
 * Gets the time in 12 hour format
 * @returns {String} time in 12 hour format
 */
export const getTime12hours = (): string => {
  const now = new Date(Date.now());

  let minutes: number | string = now.getMinutes();
  let hours: number | string = now.getHours();

  const ampm = hours >= 12 ? 'pm' : 'am';
  hours %= 12;

  // the hour '0' should be 12
  hours = hours || '12';

  minutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutes}${ampm}`;
};

export const unixTimeStamp = (date: Date): number => getUnixTime(date);

/**
 * Returns the duration between 2 time periods
 * @param {String} startTime
 * @param {String} endTime
 * @param {String} dateFormat Optional time format
 * @returns {String} duration in human readable format
 * */
export const getDuration = (startTime: string, endTime: string): string => {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const diff = endDate.getTime() - startDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor(diff / 1000);

  const duration = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  return duration;
};

/**
 * Humanize the time
 * @param {string} time Time to convert to human time
 * @param {string} fromFormat Optional format to convert from
 * @param {string} toFormat Optional format to convert to
 * @returns {String} Human readable time
 */
export const humanizeDateTime = (
  time: string,
  fromFormat = DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
  toFormat = DATE_TIME_FORMAT_MMMM_D_ha,
): string => {
  const parsedDate = safeParse(time, fromFormat);
  return format(parsedDate, momentToDateFnsFormat(toFormat));
};

/**
 * Gets the relative duration of time from passed in time string up till now. e.g. in 3 days, 2 hours, 5 minutes
 * @param {string} time time string
 * @param {string} fromFormat Optional format to convert from
 * @param {boolean} removePrefix Optional flag to remove the prefix
 * @returns {string} duration of time in human readable format
 */
export const fromNow = (
  time: string,
  fromFormat = DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
  removePrefix = false,
): string => {
  const parsedDate = safeParse(time, fromFormat);
  return formatDistanceToNow(parsedDate, { addSuffix: !removePrefix });
};

/**
 * Gets the duration of time between 2 time strings and returns it in human readable format, eg. 2 Hours 30 minutes
 * @param {string} startDateTime Start date time in string format
 * @param {string} endDateTime end date time in string format
 * @param {string} formart OPTIONAL format to convert from
 * @param {boolean} strict whether to be strict about the distance between the 2 times
 * @returns {string} duration of time in human readable format
 */
export const getHumanizedDuration = (
  startDateTime: string,
  endDateTime: string,
  formart = DATE_TIME_FORMAT_YYYY_MM_DD_hh_mm_ss,
  strict = true,
): string => {
  const startDate = safeParse(startDateTime, formart);
  const endDate = safeParse(endDateTime, formart);

  if (strict) {
    return formatDistanceStrict(startDate, endDate);
  }
  return formatDistance(startDate, endDate);
};
