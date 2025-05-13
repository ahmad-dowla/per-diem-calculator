// Types
import type { Location } from '../../types/locations';
import type { RateLodging } from '../../types/expenses';
import type { DateRaw } from '../../types/dates';

// Utils
import { fetchJsonGSA } from '../fetch';
import { returnValidYear } from '../dates';

export const getCitiesDomestic = async (
    date: DateRaw,
    country: string,
): Promise<Location[]> => {
    try {
        const year = returnValidYear(date);
        const data = await fetchJsonGSA<RateLodging>(year, 'lodging');
        // Get only the selected state's cities
        const filteredData = data
            .filter(
                rate =>
                    rate.State !== null &&
                    rate.State !== '' &&
                    rate.State.toLowerCase() === country.toLowerCase(),
            )
            // Create array of { city, country } objects from records
            // If a record has counties, append them to the city name
            .map(rate => {
                return rate.County === null ?
                        { city: rate.City, country: country, label: rate.City }
                    :   {
                            city: rate.City,
                            country: country,
                            label: `${rate.City} / ${rate.County}`,
                        };
            });
        const result = filteredData
            // For returned array of { City, Country } objects, set 'Standard Rate' as first object
            .filter(rate => rate.city === 'Standard Rate')
            // For remaining objects, alphabetize by city
            .concat(
                filteredData
                    .filter(rate => rate.city !== 'Standard Rate')
                    .sort((a, b) => a.city.localeCompare(b.city)),
            );
        return result;
    } catch (error) {
        throw new Error(
            `Failed to get domestic cities for ${date} and ${country}`,
        );
    }
};
