// Types
import type { StateExpenseItem } from '../../types/expenses';
import type { DateRaw } from '../../types/dates';

// Utils
import { fetchXmlDOD, parseXml } from '../fetch';
import { parseIntlLodgingRates } from './parseIntlLodgingRates';
import { getValidAPIYear, isDateRawType, getYYYY, getDateRaw } from '../dates';

const getRecords = async (expense: StateExpenseItem): Promise<Element[]> => {
    const data = await fetchXmlDOD(getValidAPIYear(expense.date));
    if (!data) throw new Error(`Error getting rates from XML`);
    return parseXml(
        data,
        `//record[location_name[text()="${expense.city}"]]`,
    ) as Element[];
};

const getRecord = (expense: StateExpenseItem, records: Element[]) => {
    const { date, country, city } = expense;
    const record = parseIntlLodgingRates(date, country, records);
    if (!record)
        throw new Error(
            `Failed to pull intl rate from XML records for ${date}: ${country} - ${city}.`,
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

const createRatesObj = (
    dateRaw: DateRaw,
    lodgingText: string,
    mieText: string,
    rateStartDateText: string,
) => {
    const maxLodging = +lodgingText;
    const maxMie = +mieText;

    // OCONUS has different rates with the same effective date but different season start/end dates
    // We'll create an effective date based on the rate's season start date, and reduce the year by 1 if it's newer than the trip date
    const rateStartDate = new Date(
        `${getYYYY(dateRaw)}-${rateStartDateText.replaceAll('/', '-')}`,
    );
    const tripDate = new Date(dateRaw);
    if (tripDate < rateStartDate)
        rateStartDate.setUTCFullYear(+getYYYY(dateRaw) - 1);
    const effDate = getDateRaw(rateStartDate.toISOString());

    if (!isDateRawType(effDate))
        throw new Error(
            `Failed to create valid effective date for ${dateRaw} `,
        );

    return {
        maxLodging,
        maxMie,
        effDate,
    };
};

const createStateExpenseItem = (
    expense: StateExpenseItem,
    maxLodging: number,
    maxMie: number,
    effDate: DateRaw,
): StateExpenseItem => {
    return {
        ...expense,
        rates: {
            maxLodging,
            maxMie,
            effDate,
        },
    };
};

export const getLodgingRateIntl = async (
    expense: StateExpenseItem,
): Promise<StateExpenseItem> => {
    try {
        return await getRecords(expense)
            .then(records => getRecord(expense, records))
            .then(record => getRecordEls(record))
            .then(recordEls => {
                const { lodgingText, mieText, rateStartDateText } = recordEls;
                return createRatesObj(
                    expense.date,
                    lodgingText,
                    mieText,
                    rateStartDateText,
                );
            })
            .then(ratesObj => {
                const { maxLodging, maxMie, effDate } = ratesObj;
                return createStateExpenseItem(
                    expense,
                    maxLodging,
                    maxMie,
                    effDate,
                );
            });
    } catch (error) {
        throw new Error(
            `Failed to get lodging rate for ${expense.date} - ${expense.city} - ${error}`,
        );
    }
};
