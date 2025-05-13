import type { DateRaw } from '../../types/dates';

import { years } from './years';
import { months } from './months';
import { days } from './days';
import { inPrimitiveType } from '../misc';

export const isDateRawType = (s: string): s is DateRaw => {
  if (!s) return false;
  const splitDate = s.split('-'); // split 2024-02-01
  if (splitDate.length !== 3) return false; // expected result [0]2024 [1]02 [02]01
  const year = splitDate[0];
  const month = splitDate[1];
  const day = splitDate[2];
  return (
    inPrimitiveType(years, year) && inPrimitiveType(months, month) && inPrimitiveType(days, day)
  );
};
