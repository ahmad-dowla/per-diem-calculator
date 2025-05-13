// Types
import { DateRaw } from '../../types/dates';

export const getShortDate = (date: DateRaw): string => {
    return `${date.slice(5).replaceAll('-', '/')}/${date.slice(2, 4)}`;
};
