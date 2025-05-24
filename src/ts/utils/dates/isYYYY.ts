// Types
import type { YYYY } from '../../types/dates';

// Utils
import { years } from './isDateRaw';
import { inPrimitiveType } from '../misc';

export const isYYYY = (s: string): s is YYYY => {
    return inPrimitiveType(years, s);
};
