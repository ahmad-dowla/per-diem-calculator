// Types
import type { RateLodging, StateExpenseItem } from '../../types/expenses';

// Utils
import { isShortMonth } from '../dates/isShortMonth';
import { fetchJsonGSA } from '../fetch';
import { isDateRawType, returnValidYear } from '../dates';

export const getLodgingRateDomestic = async (
    expense: StateExpenseItem,
): Promise<StateExpenseItem> => {
    const { date: dateRaw, country, city } = expense;
    const year = returnValidYear(dateRaw);
    const date = new Date(dateRaw);
    const lodgingMonth = date.toUTCString().slice(8, 11).toString();
    if (!isShortMonth(lodgingMonth))
        throw new Error('Invalid month for fetching rates from GSA.');

    const lodgingRates = await fetchJsonGSA<RateLodging>(year, 'lodging');
    if (!lodgingRates)
        throw new Error('Failed to fetch lodging rates from GSA.');

    const lodgingRate = lodgingRates.find(
        rate =>
            rate.State !== null && rate.State === country && rate.City === city,
    );
    if (!lodgingRate)
        throw new Error(
            'Failed to find lodging rate in fetched data from GSA.',
        );

    const effDate = `${dateRaw.slice(0, 7)}-01`;
    if (!isDateRawType(effDate))
        throw new Error(
            `Failed to create valid effective date for rate: ${expense.date} - ${expense.city}`,
        );
    const rates = {
        maxLodging: +lodgingRate[lodgingMonth],
        maxMie: +lodgingRate.Meals,
        effDate,
    };

    return {
        ...expense,
        rates,
    };
};
