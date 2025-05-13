// Types
import { DateRaw } from './types/dates';
import type {
    AllViewLocationsValid,
    Location,
    StateLocationItem,
} from './types/locations';
import type { StateExpenseItemUpdate } from './types/expenses';
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

// State object to hold all data
const state: State = {
    locations: [],
    locationsValid: [],
    expenses: [],
    expensesValid: [],
};

// Update all locations
export const updateAllStateLocations = (
    updatedRows: StateLocationItem[],
): void => {
    state.locations = updatedRows;
    console.table(state.locations, [
        'start',
        'end',
        'category',
        'country',
        'city',
    ]);
};

// Update single location
export const updateStateLocation = (
    updatedLocation: StateLocationItem,
): void => {
    state.locations[updatedLocation.index] = updatedLocation;
    console.table(state.locations, [
        'start',
        'end',
        'category',
        'country',
        'city',
    ]);
};

// Return countries or cities based on category
export const returnOptions = async (
    row: StateLocationItem,
): Promise<Location[]> => {
    const { index, end, category, country } = row;
    // If country exists, it must be to create cities
    const listType = !!country ? 'city' : 'country';
    if (!end) throw new Error(`Location ${index} - no end date`);
    const list =
        !!country ?
            country.length === 2 ?
                // Domestic countries are all state abbreviations with length of 2 (e.g. 'NY')
                await getCitiesDomestic(end, country)
            :   await getCitiesIntl(end, country)
        : category === 'domestic' ? await getCountriesDomestic(end)
        : await getCountriesIntl(end);
    if (list.length === 0)
        throw new Error(`Failed to get ${listType} list for ${end}`);
    return list;
};

// Validate all locations by confirming they have all the required values
export const validateStateLocations = (): boolean => {
    state.locationsValid.length = 0;
    state.locations.forEach(location => {
        const validLocation = returnValidStateLocation(location);
        validLocation && state.locationsValid.push(validLocation);
    });
    return state.locations.length === state.locationsValid.length;
};

// Create expenses based on valid locations
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
            return expense.country.length === 2 ?
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

export const updateStateExpenseItem = (update: StateExpenseItemUpdate) => {
    const {
        date,
        lodgingAmount,
        breakfastProvided,
        lunchProvided,
        dinnerProvided,
    } = update;
    const item = state.expensesValid.find(expense => expense.date === date);
    if (!item)
        throw new Error(
            `Failed to find expense item in state matching the expense update.`,
        );

    item.lodgingAmount = lodgingAmount;
    item.deductions = {
        ...item.deductions,
        breakfastProvided,
        lunchProvided,
        dinnerProvided,
    };

    if (item.mieAmount > 0) {
        const {
            deductionBreakfast,
            deductionLunch,
            deductionDinner,
            maxIncidental,
        } = item.rates;
        let mealsTotal =
            item.deductions.FirstLastDay ?
                item.rates.maxMieFirstLast
            :   item.rates.maxMie;
        if (breakfastProvided) mealsTotal -= deductionBreakfast;
        if (lunchProvided) mealsTotal -= deductionLunch;
        if (dinnerProvided) mealsTotal -= deductionDinner;
        if (mealsTotal < maxIncidental) mealsTotal = maxIncidental;

        item.mieAmount = mealsTotal;
    }

    item.totalAmount = item.lodgingAmount + item.mieAmount;

    const { totalMie, totalLodging } = state.expensesValid.reduce(
        (result, item) => {
            result.totalMie += item.mieAmount;
            result.totalLodging += item.lodgingAmount;
            return result;
        },
        { totalMie: 0, totalLodging: 0 },
    );
    return {
        date: item.date,
        newRowMieTotal: item.mieAmount,
        totalMie,
        totalLodging,
    };
};

export const returnExpenses = () => {
    return state.expensesValid;
};
