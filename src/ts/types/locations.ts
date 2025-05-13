import { DateRaw } from './dates';

export type Location = {
    city?: string;
    country?: string;
    label?: string;
    category?: 'domestic' | 'intl';
};

export type AllViewLocationsValid = {
    valid: boolean;
    expensesCategory: 'mie' | 'lodging' | 'both';
};

export type StateLocationItem = Omit<Location, 'label'> & {
    index: number;
    start?: DateRaw;
    end?: DateRaw;
};

export type LocationKeys = keyof Omit<StateLocationItem, 'index'>;

export type StateLocationItemValid = Required<
    Omit<StateLocationItem, 'index' | 'category'>
>;
