// Types
import type { Location } from '../../types/locations';
import type { DateRaw } from '../../types/dates';

// Utils
import { fetchXmlDOD, parseXml } from '../fetch';
import { returnValidYear } from '../dates';

export const getCountriesIntl = async (date: DateRaw): Promise<Location[]> => {
    try {
        const year = returnValidYear(date);
        const data = await fetchXmlDOD(year);
        if (!data) throw new Error(`Error getting cities from XML`);
        // Get only the selected country's cities
        const records = parseXml(data, `//data/*`) as Element[];
        const result = records
            // Create array of { City, Country } objects from records
            .reduce((result: Location[], record) => {
                const country =
                    record.querySelector('country_name')?.textContent;
                if (!country) return result;
                const obj = {
                    country: country,
                    label: country,
                };
                result.push(obj);
                return result;
            }, [])
            // Alphabetize objects by country
            .sort((a, b) => {
                return (a.country || '').localeCompare(b.country || '');
            })
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
        throw new Error(`Failed to get int'l countries for ${date}`);
    }
};
