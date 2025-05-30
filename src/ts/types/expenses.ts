import type { DateRaw } from './dates';

// Format of lodging rate data coming from GSA
export interface RateLodging {
    Jan: string;
    Feb: string;
    Mar: string;
    Apr: string;
    May: string;
    Jun: string;
    Jul: string;
    Aug: string;
    Sep: string;
    Oct: string;
    Nov: string;
    Meals: number;
    City: string;
    State: string;
    County: string | null;
    DID: number;
    Dec: string;
}

// Format of meals rate data coming from GSA
export interface RateMeals {
    total: number;
    breakfast: number;
    lunch: number;
    dinner: number;
    incidental: number;
    FirstLastDay: number;
    max?: number;
}

interface ExpenseDeductions {
    FirstLastDay: boolean;
    breakfastProvided: boolean;
    lunchProvided: boolean;
    dinnerProvided: boolean;
}

export interface ExpenseRates {
    maxLodging: number;
    maxMie: number;
    maxMieFirstLast?: number;
    deductionBreakfast?: number;
    deductionLunch?: number;
    deductionDinner?: number;
    maxIncidental?: number;
    effDate: DateRaw;
}

export interface StateExpenseItem {
    date: DateRaw;
    country: string;
    city: string;
    deductions: ExpenseDeductions;
    rates?: ExpenseRates;
}

export type StateExpenseItemInclRates = StateExpenseItem & {
    rates: Required<ExpenseRates>;
    lodgingAmount: number;
    mieAmount: number;
    totalAmount: number;
};

export type StateExpenseItemValid = Required<StateExpenseItemInclRates> & {
    source: string;
};

export type StateExpenseItemUpdate = Omit<ExpenseDeductions, 'FirstLastDay'> &
    Pick<StateExpenseItemValid, 'date' | 'lodgingAmount'>;
