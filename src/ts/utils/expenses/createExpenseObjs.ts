// Types
import type { StateLocationItemValid } from '../../types/locations';
import type { StateExpenseItem } from '../../types/expenses';

// Utils
import { isDateRawType, getDateRaw } from '../dates';

export const createExpenseObjs = (
    location: StateLocationItemValid,
): StateExpenseItem[] => {
    const { start, end, country, city } = location;
    const expenses: StateExpenseItem[] = [];
    const currentDate = new Date(start);
    const lastDate = new Date(end);
    while (currentDate <= lastDate) {
        const currentDateRaw = getDateRaw(currentDate.toISOString());
        if (!isDateRawType(currentDateRaw))
            throw new Error('Failed to create valid date.');
        expenses.push({
            date: currentDateRaw,
            country: country,
            city: city,
            deductions: {
                FirstLastDay: false,
                breakfastProvided: false,
                lunchProvided: false,
                dinnerProvided: false,
            },
        });
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    expenses[0].deductions.FirstLastDay = true;
    expenses[expenses.length - 1].deductions.FirstLastDay = true;
    return expenses;
};
