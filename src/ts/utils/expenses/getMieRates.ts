// Types
import type {
    RateMeals,
    ExpenseRates,
    StateExpenseItem,
    StateExpenseItemInclRates,
} from '../../types/expenses';

// Utils
import { fetchJsonGSA } from '../fetch';
import { intlMieRates } from './intlMieRates';
import { returnValidYear } from '../dates';

export const getMieRates = async (
    expensesCategory: string,
    expense: StateExpenseItem,
): Promise<StateExpenseItemInclRates> => {
    if (!expense.rates?.maxMie)
        throw new Error(
            `Failed to get M&IE rates for ${expense.date} - ${expense.city} due to missing rate/deduction information in the expense object.`,
        );

    const year = returnValidYear(expense.date);
    const mealsRates =
        expense.country.length === 2 ?
            await fetchJsonGSA<RateMeals>(year, 'mie')
        :   intlMieRates;
    if (!mealsRates) throw new Error('Failed to fetch meal rates from GSA.');

    const meals = mealsRates.find(rate => rate.total === expense.rates?.maxMie);
    if (!meals)
        throw new Error('Failed to find meal rates that matched total MIE.');

    const rates: Required<ExpenseRates> = {
        ...expense.rates,
        maxMieFirstLast: meals.FirstLastDay,
        deductionBreakfast: meals.breakfast,
        deductionLunch: meals.lunch,
        deductionDinner: meals.dinner,
        maxIncidental: meals.incidental,
    };

    const lodgingAmount =
        expensesCategory === 'mie' ? 0 : expense.rates.maxLodging;
    const mieAmount =
        expensesCategory === 'lodging' ? 0
        : expense.deductions.FirstLastDay ? rates.maxMieFirstLast
        : rates.maxMie;
    const totalAmount = lodgingAmount + mieAmount;

    return {
        ...expense,
        rates,
        lodgingAmount,
        mieAmount,
        totalAmount,
    };
};
