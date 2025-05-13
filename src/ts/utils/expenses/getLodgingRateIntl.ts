// Types
import type { StateExpenseItem } from '../../types/expenses';

// Utils
import { fetchXmlDOD, parseXml } from '../fetch';
import { parseIntlLodgingRates } from './parseIntlLodgingRates';
import { returnValidYear, isDateRawType } from '../dates';

export const getLodgingRateIntl = async (
    expense: StateExpenseItem,
): Promise<StateExpenseItem> => {
    const { date: dateRaw, country, city } = expense;
    const year = returnValidYear(dateRaw);
    const data = await fetchXmlDOD(year);
    if (!data) throw new Error(`Error getting rates from XML`);

    // Get only the selected country's cities
    const records = parseXml(
        data,
        `//record[location_name[text()="${city}"]]`,
    ) as Element[];

    const record = parseIntlLodgingRates(dateRaw, country, records);
    if (!record)
        throw new Error(
            `Failed to pull intl rate from XML records for ${dateRaw}: ${country} - ${city}.`,
        );

    const lodgingText = record.querySelector('lodging_rate')?.textContent;
    const mieText = record.querySelector('local_meals')?.textContent;
    const effDateText = record.querySelector('eff_date')?.textContent;

    if (!(lodgingText && mieText && effDateText))
        throw new Error(
            'Failed to pull lodging rate, mie rate, effective date from XML records.',
        );

    const effDate = `${effDateText.split('/')[2]}-${effDateText.split('/')[0]}-${effDateText.split('/')[1]}`;
    if (!isDateRawType(effDate))
        throw new Error(
            `Failed to create valid effective date for rate: ${expense.date} - ${expense.city}`,
        );

    const rates = {
        maxLodging: +lodgingText,
        maxMie: +mieText,
        effDate,
    };

    return { ...expense, rates };
};
