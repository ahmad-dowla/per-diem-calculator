// Types
import type { Location } from '../../types/locations';
import type { DateRaw } from '../../types/dates';
import type { RateLodging } from '../../types/expenses';

// Utils
import { fetchJsonGSA } from '../fetch';
import { LIST_US_STATES } from './LIST_US_STATES';
import { returnValidYear } from '../dates';

export const getCountriesDomestic = async (
    date: DateRaw,
): Promise<Location[]> => {
    try {
        const year = returnValidYear(date);
        const data = await fetchJsonGSA<RateLodging>(year, 'lodging');
        // Get only the selected state's cities
        const filteredData = data
            .filter(rate => rate.State !== null && rate.State !== '')
            .map(rate => {
                return {
                    country: rate.State,
                    label: LIST_US_STATES.find(
                        state => state.country === rate.State,
                    )?.label,
                };
            });
        const result = filteredData
            .sort((a, b) => a.country.localeCompare(b.country))
            // Only keep objects with unique cities (e.g. eliminate duplicates)
            .filter((record, index, array) => {
                if (index === 0) return true;
                const prevRecord = array[index - 1];
                return (
                    record &&
                    prevRecord &&
                    record.country !== prevRecord.country
                );
            });
        return result;
    } catch (error) {
        throw new Error(`Failed to get domestic countries for ${date}`);
    }
};
