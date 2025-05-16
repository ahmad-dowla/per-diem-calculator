import type { StateLocationItem, StateLocationItemValid } from './locations';
import type { StateExpenseItem, StateExpenseItemValid } from './expenses';

export type ConfigSectionText = {
    heading?: string;
    headingPrint?: string;
    body?: string;
    bodyPrint?: string;
};

export type Config = {
    styled: boolean;
    location: ConfigSectionText;
    expense: ConfigSectionText;
};

// Model's state holding all data
export interface State {
    locations: StateLocationItem[];
    locationsValid: StateLocationItemValid[];
    expenses: StateExpenseItem[];
    expensesValid: StateExpenseItemValid[];
}
