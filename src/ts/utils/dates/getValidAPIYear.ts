// Types
import type { DateRaw, YYYY } from '../../types/dates';

// Utils
import { isYYYY } from './isYYYY';
import { getYYYY } from './getDateSlice';

export const getValidAPIYear = (dateRaw: DateRaw): YYYY => {
    const dateYYYY = getYYYY(dateRaw);
    const today = new Date();
    const todayYYYY = getYYYY(today.toISOString());

    if (!isYYYY(dateYYYY) || !isYYYY(todayYYYY))
        throw new Error('Failed to create valid year for API call.');

    return +dateYYYY > +todayYYYY ? todayYYYY : dateYYYY;
};
