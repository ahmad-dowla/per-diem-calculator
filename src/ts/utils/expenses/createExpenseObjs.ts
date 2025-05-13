// Types
import type { StateLocationItemValid } from '../../types/locations';
import type { StateExpenseItem } from '../../types/expenses';

// Utils
import { isDateRawType } from '../dates';

export const createExpenseObjs = (
    location: StateLocationItemValid,
): StateExpenseItem[] => {
    const { startDate, endDate, country, city } = location;
    const expenses: StateExpenseItem[] = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    while (currentDate <= lastDate) {
        const currentDateRaw = currentDate.toISOString().slice(0, 10);
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
