// Types
import type { DateRaw } from '../../types/dates';

// Utils
import { inPrimitiveType } from '../misc';
import { getYYYY, getMM, getDD } from './getDateSlice';

export const isDateRawType = (s: string): s is DateRaw => {
    if (!s) return false;
    const year = getYYYY(s);
    const month = getMM(s);
    const day = getDD(s);
    return (
        inPrimitiveType(years, year) &&
        inPrimitiveType(months, month) &&
        inPrimitiveType(days, day)
    );
};

export const years = [
    '2021',
    '2022',
    '2023',
    '2024',
    '2025',
    '2026',
    '2027',
    '2028',
    '2029',
    '2030',
    '2031',
    '2032',
    '2033',
    '2034',
    '2035',
    '2036',
    '2037',
    '2038',
    '2039',
    '2040',
] as const;

const months: string[] = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
] as const;

const days: string[] = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
] as const;
