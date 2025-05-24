// Types
import type { ShortMonth } from '../../types/dates';

// Utils
import { inPrimitiveType } from '../misc';

export const isShortMonth = (s: string): s is ShortMonth => {
    return inPrimitiveType(shortMonths, s);
};

const shortMonths = [
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
