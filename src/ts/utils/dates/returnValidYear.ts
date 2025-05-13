import type { DateRaw, YYYY } from '../../types/dates';

import { isYYYY } from './isYYYY';

export const returnValidYear = (dateRaw: DateRaw): YYYY => {
  const dateYYYY = dateRaw.slice(0, 4);
  const today = new Date();
  const todayYYYY = today.toISOString().slice(0, 4);

  if (!isYYYY(dateYYYY) || !isYYYY(todayYYYY))
    throw new Error('Failed to create valid year for API call.');

  return +dateYYYY > +todayYYYY ? todayYYYY : dateYYYY;
};
