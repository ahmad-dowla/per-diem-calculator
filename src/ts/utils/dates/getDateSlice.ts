// Utils
const DATE_ISO_STRING = 'YYYY-MM-DD';

const YYYY_START_POSITION = DATE_ISO_STRING.indexOf('Y');
const YYYY_END_POSITION = YYYY_START_POSITION + 'YYYY'.length;

const YY_START_POSITION = DATE_ISO_STRING.lastIndexOf('YY');
const YY_END_POSITION = YY_START_POSITION + 'YY'.length;

const MM_START_POSITION = DATE_ISO_STRING.indexOf('M');
const MM_END_POSITION = MM_START_POSITION + 'MM'.length;

const DD_START_POSITION = DATE_ISO_STRING.indexOf('D');
const DD_END_POSITION = DD_START_POSITION + 'DD'.length;

const DATE_UTC_STRING = 'Wed, 14 Jun 2017 07:00:00 GMT';
const SHORT_MONTH_START_POSITION = DATE_UTC_STRING.indexOf('Jun');
const SHORT_MONTH_END_POSITION = SHORT_MONTH_START_POSITION + 'Jun'.length;

const checkIfDateISO = (date: string) => {
    if (!(date.length >= DATE_ISO_STRING.length))
        throw new Error('Invalid date string format.');
};

const checkIfDateUTCString = (date: string) => {
    if (date.length !== DATE_UTC_STRING.length)
        throw new Error('Invalid date string format.');
};

// 2024-01-30
export const getDateRaw = (date: string) => {
    checkIfDateISO(date);
    return date.slice(YYYY_START_POSITION, DATE_ISO_STRING.length);
};
export const getYYYY = (date: string) => {
    checkIfDateISO(date);
    return date.slice(YYYY_START_POSITION, YYYY_END_POSITION); // 2024
};
export const getYY = (date: string, category: 'ISO' | 'YYYY' = 'ISO') => {
    if (category === 'ISO') checkIfDateISO(date);
    return date.slice(YY_START_POSITION, YY_END_POSITION); // 24
};
export const getMM = (date: string) => {
    checkIfDateISO(date);
    return date.slice(MM_START_POSITION, MM_END_POSITION); // 01
};
export const getDD = (date: string) => {
    checkIfDateISO(date);
    return date.slice(DD_START_POSITION, DD_END_POSITION); // 30
};
export const getShortMonth = (date: string) => {
    checkIfDateUTCString(date);
    return date.slice(SHORT_MONTH_START_POSITION, SHORT_MONTH_END_POSITION);
};
