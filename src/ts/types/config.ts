import type { StateLocationItem, StateLocationItemValid } from './locations';
import type { StateExpenseItem, StateExpenseItemValid } from './expenses';

export interface Config {
    styled: boolean;
    location: ConfigSectionText;
    expense: ConfigSectionText;
}

export interface ConfigSectionText {
    heading?: string;
    headingPrint?: string;
    body?: string;
    bodyPrint?: string;
}

export interface State {
    locations: StateLocationItem[];
    locationsValid: StateLocationItemValid[];
    expenses: StateExpenseItem[];
    expensesValid: StateExpenseItemValid[];
}
