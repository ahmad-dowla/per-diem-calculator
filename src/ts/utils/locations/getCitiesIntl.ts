// Types
import type { Location } from '../../types/locations';
import type { DateRaw } from '../../types/dates';

// Utils
import { fetchXmlDOD, parseXml } from '../fetch';
import { getValidAPIYear } from '../dates';
import { sortLocations } from './sortLocations';
import { keepUniqueLocations } from './keepUniqueLocations';

const getCities = (data: string, country: string): Element[] => {
    return parseXml(
        data,
        `//record[country_name[text()="${country.toUpperCase()}"]]`,
    ) as Element[];
};

const createLocations = (
    data: Element[],
    date: DateRaw,
    country: string,
): Location[] => {
    return data.reduce((result: Location[], record) => {
        const city = record.querySelector('location_name')?.textContent;
        const expDateText = record.querySelector('exp_date')?.textContent;
        const effDateText = record.querySelector('eff_date')?.textContent;
        if (!city || !expDateText || !effDateText) return result; // City not found, move to next

        const expDate = new Date(
            `${expDateText.split('/')[2]}-${expDateText.split('/')[0]}-${expDateText.split('/')[1]}`,
        );
        const effDate = new Date(
            `${effDateText.split('/')[2]}-${effDateText.split('/')[0]}-${effDateText.split('/')[1]}`,
        );
        const tripDate = new Date(date);
        if (tripDate > expDate || tripDate < effDate) return result; // Date before rate's effective date, or after rate's expiration date, move to next

        const obj = {
            city: city,
            country: country,
            label: city,
        };
        result.push(obj);
        return result;
    }, []);
};

export const getCitiesIntl = async (
    date: DateRaw,
    country: string,
): Promise<Location[]> => {
    try {
        return await fetchXmlDOD(getValidAPIYear(date))
            .then(data => getCities(data, country))
            .then(data => createLocations(data, date, country))
            .then(data => sortLocations(data, 'city'))
            .then(data => keepUniqueLocations(data, 'city'));
    } catch (error) {
        throw new Error(
            `Failed to get int'l cities for ${date} - ${country} - ${error}`,
        );
    }
};
