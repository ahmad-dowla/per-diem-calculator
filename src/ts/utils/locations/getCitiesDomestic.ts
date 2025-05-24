// Types
import type { Location } from '../../types/locations';
import type { RateLodging } from '../../types/expenses';
import type { DateRaw } from '../../types/dates';

// Utils
import { fetchJsonGSA } from '../fetch';
import { getValidAPIYear } from '../dates';
import { sortLocations } from './sortLocations';
import { keepUniqueLocations } from './keepUniqueLocations';

const getCities = (data: RateLodging[], country: string): RateLodging[] => {
    return data.filter(
        rate =>
            rate.State !== null &&
            rate.State !== '' &&
            rate.State.toLowerCase() === country.toLowerCase(),
    );
};

const createLocations = (data: RateLodging[], country: string): Location[] => {
    return data.map(rate => {
        return rate.County === null ?
                { city: rate.City, country: country, label: rate.City }
            :   {
                    city: rate.City,
                    country: country,
                    label: `${rate.City} / ${rate.County}`,
                };
    });
};

export const getCitiesDomestic = async (
    date: DateRaw,
    country: string,
): Promise<Location[]> => {
    try {
        return await fetchJsonGSA<RateLodging>(getValidAPIYear(date), 'lodging')
            .then(data => getCities(data, country))
            .then(data => createLocations(data, country))
            .then(data => sortLocations(data, 'city', 'domesticCities'))
            .then(data => keepUniqueLocations(data, 'city'));
    } catch (error) {
        throw new Error(
            `Failed to get domestic cities for ${date} - ${country} - ${error}`,
        );
    }
};
