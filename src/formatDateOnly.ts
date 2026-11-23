/**
 * Date-only values (SQL `date` columns such as effective / inception or expiry
 * dates) are calendar days, not instants. Passing them through `Date` shifts the
 * day in time zones west of UTC, so these helpers read the ISO string directly
 * and never construct a `Date`.
 */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const daysInMonth = (year: number, month: number): number => {
  if (month === 2) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

/** True when `value` is a real calendar day in `YYYY-MM-DD` form. */
export function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = DATE_ONLY.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/**
 * Formats a `YYYY-MM-DD` date-only string as `DD Mon YYYY`, for example
 * `formatDateOnly('2027-01-01')` → `'01 Jan 2027'`. The result is the same in
 * every time zone. Returns `null` for missing or invalid input so the caller
 * can show its empty placeholder (or the raw value, so data stays visible).
 */
export function formatDateOnly(value: string | null | undefined): string | null {
  if (!isDateOnly(value)) return null;
  const [year, month, day] = value.split('-');
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
}
