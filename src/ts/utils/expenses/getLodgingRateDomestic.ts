// Types
import type { RateLodging, StateExpenseItem } from '../../types/expenses';
import type { ShortMonth } from '../../types/dates';

// Utils
import { fetchJsonGSA } from '../fetch';
import {
    isDateRawType,
    getValidAPIYear,
    isShortMonth,
    getShortMonth,
    getYYYY,
    getMM,
} from '../dates';

const getRate = (
    expense: StateExpenseItem,
    rates: RateLodging[],
): RateLodging => {
    const lodgingRate = rates.find(
        rate =>
            rate.State !== null &&
            rate.State === expense.country &&
            rate.City === expense.city,
    );
    if (!lodgingRate)
        throw new Error(
            'Failed to find lodging rate in fetched data from GSA.',
        );
    return lodgingRate;
};

const createStateExpenseItem = (
    expense: StateExpenseItem,
    lodgingRate: RateLodging,
    lodgingMonth: ShortMonth,
): StateExpenseItem => {
    const effDate = `${getYYYY(expense.date)}-${getMM(expense.date)}-01`;
    if (!isDateRawType(effDate))
        throw new Error(
            `Failed to create valid effective date for rate: ${expense.date} - ${expense.city}`,
        );
    return {
        ...expense,
        rates: {
            maxLodging: +lodgingRate[lodgingMonth],
            maxMie: +lodgingRate.Meals,
            effDate,
        },
    };
};

export const getLodgingRateDomestic = async (
    expense: StateExpenseItem,
): Promise<StateExpenseItem> => {
    try {
        const date = new Date(expense.date);
        const lodgingMonth = getShortMonth(date.toUTCString());
        if (!isShortMonth(lodgingMonth))
            throw new Error('Invalid month for fetching rates from GSA.');

        return await fetchJsonGSA<RateLodging>(
            getValidAPIYear(expense.date),
            'lodging',
        )
            .then(rates => getRate(expense, rates))
            .then(rate => createStateExpenseItem(expense, rate, lodgingMonth));
    } catch (error) {
        throw new Error(
            `Failed to get lodging rate for ${expense.date} = ${expense.city} - ${error}`,
        );
    }
};
