// Types
import type { Location } from '../../types/locations';
import type { DateRaw } from '../../types/dates';

// Utils
import { fetchXmlDOD, parseXml } from '../fetch';
import { returnValidYear } from '../dates';

export const getCitiesIntl = async (
    date: DateRaw,
    country: string,
): Promise<Location[]> => {
    try {
        const year = returnValidYear(date);
        const data = await fetchXmlDOD(year);
        if (!data) throw new Error(`Error getting cities from XML`);
        // Get only the selected country's cities
        const records = parseXml(
            data,
            `//record[country_name[text()="${country.toUpperCase()}"]]`,
        ) as Element[];
        const result = records
            // Create array of { City, Country } objects from records
            .reduce((result: Location[], record) => {
                const city = record.querySelector('location_name')?.textContent;
                const expDateText =
                    record.querySelector('exp_date')?.textContent;
                const effDateText =
                    record.querySelector('eff_date')?.textContent;
                if (!city || !expDateText || !effDateText) return result; // City not found, move to next
                const expDate = new Date(
                    `${expDateText.split('/')[2]}-${expDateText.split('/')[0]}-${expDateText.split('/')[1]}`,
                );
                const effDate = new Date(
                    `${effDateText.split('/')[2]}-${effDateText.split('/')[0]}-${effDateText.split('/')[1]}`,
                );
                const tripDate = new Date(date);
                if (tripDate > expDate || tripDate < effDate) return result; // Date before city rate's effective date or after rate's expiration date, move to next
                const obj = {
                    city: city,
                    country: country,
                    label: city,
                };
                result.push(obj);
                return result;
            }, [])
            // Alphabetize objects by city
            .sort((a, b) => {
                return (a.city || '').localeCompare(b.city || '');
            })
            // Only keep objects with unique cities (e.g. eliminate duplicates)
            .filter((record, index, array) => {
                if (index === 0) return true;
                const prevRecord = array[index - 1];
                return record && prevRecord && record.city !== prevRecord.city;
            });
        return result;
    } catch (error) {
        throw new Error(
            `Failed to get int'l cities for ${date} and ${country}`,
        );
    }
};
