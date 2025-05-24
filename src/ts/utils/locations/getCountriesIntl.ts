// Types
import type { Location } from '../../types/locations';
import type { DateRaw } from '../../types/dates';

// Utils
import { fetchXmlDOD, parseXml } from '../fetch';
import { getValidAPIYear } from '../dates';
import { sortLocations } from './sortLocations';
import { keepUniqueLocations } from './keepUniqueLocations';

const createLocations = (data: Element[]): Location[] => {
    return data.reduce((result: Location[], record) => {
        const country = record.querySelector('country_name')?.textContent;
        if (!country) return result;
        const obj = {
            country: country,
            label: country,
        };
        result.push(obj);
        return result;
    }, []);
};

export const getCountriesIntl = async (date: DateRaw): Promise<Location[]> => {
    try {
        return await fetchXmlDOD(getValidAPIYear(date))
            .then(data => parseXml(data, `//data/*`) as Element[])
            .then(data => createLocations(data))
            .then(data => sortLocations(data, 'country'))
            .then(data => keepUniqueLocations(data, 'country'));
    } catch (error) {
        throw new Error(`Failed to get int'l countries for ${date} - ${error}`);
    }
};
