// Types
import type { StateExpenseItem } from '../../types/expenses';

// Utils
import { fetchXmlDOD, parseXml } from '../fetch';
import { parseIntlLodgingRates } from './parseIntlLodgingRates';
import { returnValidYear, isDateRawType } from '../dates';
import { DateRaw } from '../../types/dates';

const getRecord = async (
    dateRaw: DateRaw,
    city: string,
    country: string,
): Promise<Element> => {
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
    return record;
};

const getRecordEls = (record: Element) => {
    const lodgingText = record.querySelector('lodging_rate')?.textContent;
    const mieText = record.querySelector('local_meals')?.textContent;
    const rateStartDateText = record.querySelector('start_date')?.textContent;

    if (!(lodgingText && mieText && rateStartDateText))
        throw new Error(
            'Failed to pull lodging rate, mie rate, effective date from XML records.',
        );

    return { lodgingText, mieText, rateStartDateText };
};

const getEffectiveDate = (
    dateRaw: DateRaw,
    rateStartDateText: string,
    city: string,
): DateRaw => {
    // OCONUS has different rates with the same effective date but different season start/end dates
    // We'll create an effective date based on the rate's season start date, and reduce the year by 1 if it's newer than the trip date
    let rateStartDate = new Date(
        `${dateRaw.slice(0, 4)}-${rateStartDateText.replaceAll('/', '-')}`,
    );
    let tripDate = new Date(dateRaw);
    if (tripDate < rateStartDate)
        rateStartDate.setUTCFullYear(+dateRaw.slice(0, 4) - 1);
    const effDate = rateStartDate.toISOString().slice(0, 10);

    if (!isDateRawType(effDate))
        throw new Error(
            `Failed to create valid effective date for rate: ${dateRaw} - ${city}`,
        );

    return effDate;
};

export const getLodgingRateIntl = async (
    expense: StateExpenseItem,
): Promise<StateExpenseItem> => {
    const { date: dateRaw, country, city } = expense;
    const record = await getRecord(dateRaw, city, country);
    const { lodgingText, mieText, rateStartDateText } = getRecordEls(record);
    const effDate = getEffectiveDate(dateRaw, rateStartDateText, city);
    const rates = {
        maxLodging: +lodgingText,
        maxMie: +mieText,
        effDate,
    };
    return { ...expense, rates };
};
