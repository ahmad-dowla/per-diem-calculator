// Types
import { DateRaw } from '../../types/dates';

// Utils
import { isDateRawType } from './isDateRaw';
import { getDateRaw } from './getDateSlice';

export const offsetDateString = (
    dateRaw: DateRaw,
    offset: number | null = null,
): DateRaw => {
    const date = new Date(dateRaw);
    if (offset) date.setUTCDate(date.getUTCDate() + offset);
    const result = getDateRaw(date.toISOString());
    if (!isDateRawType(result)) throw new Error('Failed to create valid date');
    return result;
};
