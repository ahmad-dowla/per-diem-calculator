import { DateRaw } from '../../types/dates';
import { isDateRawType } from './isDateRaw';

export const offsetDateString = (dateVal: DateRaw, dayOffset: number | null = null): DateRaw => {
  const date = new Date(dateVal);
  if (dayOffset) date.setUTCDate(date.getUTCDate() + dayOffset);
  const result = date.toISOString().slice(0, 10);
  if (!isDateRawType(result)) throw new Error('Failed to create valid date');
  return result;
};
