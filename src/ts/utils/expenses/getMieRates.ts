// Types
import type {
    RateMeals,
    ExpenseRates,
    StateExpenseItem,
    StateExpenseItemInclRates,
} from '../../types/expenses';

// Utils
import { fetchJsonGSA } from '../fetch';
import { INTL_MIE_RATES } from './INTL_MIE_RATES';
import { getValidAPIYear } from '../dates';
import { US_STATE_LENGTH } from '../config';

const getMealsRate = async (expense: StateExpenseItem): Promise<RateMeals> => {
    if (!expense.rates?.maxMie)
        throw new Error(
            `Failed to get M&IE rates for ${expense.date} - ${expense.city} due to missing rate/deduction information in the expense object.`,
        );
    const mealsRates =
        expense.country.length === US_STATE_LENGTH ?
            await fetchJsonGSA<RateMeals>(getValidAPIYear(expense.date), 'mie')
        :   INTL_MIE_RATES;
    const rate = mealsRates.find(rate => rate.total === expense.rates?.maxMie);
    if (!rate)
        throw new Error('Failed to find meal rates that matched total MIE.');
    return rate;
};

const createRatesObject = (
    expense: StateExpenseItem,
    mealsRate: RateMeals,
): Required<ExpenseRates> => {
    if (!expense.rates?.maxMie)
        throw new Error(
            `Failed to get M&IE rates for ${expense.date} - ${expense.city} due to missing rate/deduction information in the expense object.`,
        );
    return {
        ...expense.rates,
        maxMieFirstLast: mealsRate.FirstLastDay,
        deductionBreakfast: mealsRate.breakfast,
        deductionLunch: mealsRate.lunch,
        deductionDinner: mealsRate.dinner,
        maxIncidental: mealsRate.incidental,
    };
};

const createStateExpenseItem = (
    expense: StateExpenseItem,
    rates: Required<ExpenseRates>,
    expensesCategory: string,
): StateExpenseItemInclRates => {
    const lodgingAmount = expensesCategory === 'mie' ? 0 : rates.maxLodging;
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

export const getMieRates = async (
    expensesCategory: string,
    expense: StateExpenseItem,
): Promise<StateExpenseItemInclRates> => {
    try {
        return await getMealsRate(expense)
            .then(mealsRate => createRatesObject(expense, mealsRate))
            .then(rates =>
                createStateExpenseItem(expense, rates, expensesCategory),
            );
    } catch (error) {
        throw new Error(
            `Failed to get mie rates for ${expense.date} - ${expense.city} - ${error}`,
        );
    }
};
