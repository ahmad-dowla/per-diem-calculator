// Types
import type {
    AllViewLocationsValid,
    Location,
    StateLocationItem,
} from './types/locations';
import type {
    StateExpenseItemUpdate,
    StateExpenseItemValid,
} from './types/expenses';
import type { State } from './types/config';

// Utils
import {
    getCountriesDomestic,
    getCountriesIntl,
    getCitiesDomestic,
    getCitiesIntl,
    returnValidStateLocation,
} from './utils/locations';
import { createExpenseObjs, getMieRates } from './utils/expenses';
import {
    getLodgingRateDomestic,
    getLodgingRateIntl,
    returnValidStateExpense,
} from './utils/expenses';
import { getMM, getYYYY } from './utils/dates';
import { US_STATE_LENGTH } from './utils/config';

const state: State = {
    locations: [],
    locationsValid: [],
    expenses: [],
    expensesValid: [],
};

export const updateAllStateLocations = (
    updatedRows: StateLocationItem[],
): void => {
    state.locations = updatedRows;
    // logStateLocation();
};

export const updateStateLocation = (
    updatedLocation: StateLocationItem,
): void => {
    state.locations[updatedLocation.index] = updatedLocation;
    // logStateLocation();
};

// Function to log every time state is updated during development
// const logStateLocation = () => {
//     console.table(state.locations, [
//         'start',
//         'end',
//         'category',
//         'country',
//         'city',
//     ]);
// }

export const returnOptions = async (
    row: StateLocationItem,
): Promise<Location[]> => {
    const { index, end, category, country } = row;
    const listType = country ? 'city' : 'country';
    if (!end) throw new Error(`Location ${index} - no end date`);
    const list =
        country ?
            country.length === US_STATE_LENGTH ?
                // Domestic countries are all state abbreviations with length of 2 (e.g. 'NY')
                await getCitiesDomestic(end, country)
            :   await getCitiesIntl(end, country)
        : category === 'domestic' ? await getCountriesDomestic(end)
        : await getCountriesIntl(end);
    if (list.length === 0)
        throw new Error(`Failed to get ${listType} list for ${end}`);
    return list;
};

export const validateStateLocations = (): boolean => {
    state.locationsValid.length = 0;
    state.locations.forEach(location => {
        const validLocation = returnValidStateLocation(location);
        if (validLocation) state.locationsValid.push(validLocation);
    });
    return state.locations.length === state.locationsValid.length;
};

export const generateExpenses = async (
    viewValidator: AllViewLocationsValid,
) => {
    const { expensesCategory } = viewValidator;
    state.expenses.length = 0;
    state.locationsValid.map(location =>
        state.expenses.push(...createExpenseObjs(location)),
    );
    const expensesWithSomeRates = await Promise.all(
        state.expenses.map(expense => {
            return expense.country.length === US_STATE_LENGTH ?
                    getLodgingRateDomestic(expense)
                :   getLodgingRateIntl(expense);
        }),
    );
    const expensesWithAllRates = await Promise.all(
        expensesWithSomeRates.map(expense => {
            return getMieRates(expensesCategory, expense);
        }),
    );
    state.expensesValid = expensesWithAllRates.map(expense => {
        return returnValidStateExpense(expense);
    });
    return state.expensesValid;
};

export const generateUniqueRates = () => {
    const rateSet = new Set<StateExpenseItemValid>();
    const getRateString = (expense: StateExpenseItemValid) => {
        const { effDate, ...rates } = expense.rates;
        const { country, city } = expense;
        return JSON.stringify({ city, country, rates });
    };
    state.expensesValid.forEach((expense, i, arr) => {
        if (i === 0 || getRateString(expense) !== getRateString(arr[i - 1]))
            rateSet.add(expense);
    });
    return rateSet;
};

export const generateUniqueSources = () => {
    const sourceSet = new Set<string>();
    state.expensesValid.forEach(expense => sourceSet.add(expense.source));
    return sourceSet;
};

export const updateStateExpenseItem = (update: StateExpenseItemUpdate) => {
    const { date, lodgingAmount, ...deductions } = update;
    const item = state.expensesValid.find(expense => expense.date === date);
    if (!item) throw new Error(`Failed to find expense matching the update.`);
    item.lodgingAmount = lodgingAmount;
    item.deductions = {
        ...item.deductions,
        ...deductions,
    };
    if (item.mieAmount > 0) updateExpenseMie(item, update);
    item.totalAmount = item.lodgingAmount + item.mieAmount;
    const { totalMie, totalLodging } = getExpenseSubtotals();
    return {
        date: item.date,
        newRowMieTotal: item.mieAmount,
        totalMie,
        totalLodging,
    };
};

const updateExpenseMie = (
    item: StateExpenseItemValid,
    update: StateExpenseItemUpdate,
) => {
    let total =
        item.deductions.FirstLastDay ?
            item.rates.maxMieFirstLast
        :   item.rates.maxMie;
    if (update.breakfastProvided) total -= item.rates.deductionBreakfast;
    if (update.lunchProvided) total -= item.rates.deductionLunch;
    if (update.dinnerProvided) total -= item.rates.deductionDinner;
    if (total < item.rates.maxIncidental) total = item.rates.maxIncidental;
    item.mieAmount = total;
};

const getExpenseSubtotals = () => {
    return state.expensesValid.reduce(
        (result, item) => {
            result.totalMie += item.mieAmount;
            result.totalLodging += item.lodgingAmount;
            return result;
        },
        { totalMie: 0, totalLodging: 0 },
    );
};

export const returnExpenses = () => {
    return state.expensesValid;
};

export const returnRates = () => {
    const expenses = generateUniqueRates();
    return [...expenses].map(expense => {
        const { rates, source } = expense;
        const eff_date = `${getMM(expense.date)}/${getYYYY(expense.date)}`;
        const location = `${expense.city}, ${expense.country}`;
        return {
            eff_date,
            location,
            ...rates,
            source,
        };
    });
};
