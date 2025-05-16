import type { DateRaw } from '../../types/dates';

const getRecordValues = (record: Element) => {
    const countryText = record.querySelector('country_name')?.textContent;
    const effDateText = record.querySelector('eff_date')?.textContent;
    const expDateText = record.querySelector('exp_date')?.textContent;
    const startDateText = record.querySelector('start_date')?.textContent;
    const endDateText = record.querySelector('end_date')?.textContent;
    if (
        !(
            countryText &&
            effDateText &&
            expDateText &&
            startDateText &&
            endDateText
        )
    )
        throw new Error(
            'Failed to pull country_name, eff_date, exp_date, start_date, end_date from XML records.',
        );
    return {
        countryText,
        effDateText,
        expDateText,
        startDateText,
        endDateText,
    };
};

const getRecordDates = (
    year: string,
    dateRaw: DateRaw,
    effDateText: string,
    expDateText: string,
    startDateText: string,
    endDateText: string,
) => {
    // Create dates from all record elements
    // start_date and end_date don't have years, so we artificially add them
    // e.g. 01/15 -> 2024-01-15
    const date = new Date(dateRaw);
    const effDate = new Date(
        `${effDateText.split('/')[2]}-${effDateText.split('/')[0]}-${effDateText.split('/')[1]}`,
    );
    const expDate = new Date(
        `${expDateText.split('/')[2]}-${expDateText.split('/')[0]}-${expDateText.split('/')[1]}`,
    );
    const startDate = new Date(`${year}-${startDateText?.replace('/', '-')}`);
    const endDate = new Date(`${year}-${endDateText?.replace('/', '-')}`);
    if (!(date && effDate && expDate && startDate && endDate))
        throw new Error(
            'Failed to create Date objects using date columns from XML records.',
        );

    return { date, effDate, expDate, startDate, endDate };
};

export const parseIntlLodgingRates = (
    dateRaw: DateRaw,
    country: string,
    records: Element[],
) => {
    return records.find(record => {
        const year = dateRaw.slice(0, 4);

        // Get record elements
        const {
            countryText,
            effDateText,
            expDateText,
            startDateText,
            endDateText,
        } = getRecordValues(record);

        // If it's not the country, no need to proceed further
        if (countryText !== country) return false;

        // Get dates from elements
        const { date, effDate, expDate, startDate, endDate } = getRecordDates(
            year,
            dateRaw,
            effDateText,
            expDateText,
            startDateText,
            endDateText,
        );

        // If trip date not after eff_date or trip date not before exp_date, no need to proceed further
        if (!(date >= effDate && date <= expDate)) return false;

        if (endDate < startDate) {
            // Some rates are effective from end of one year to start of next
            // e.g. 09/01 to 04/30
            // Previous step set start_date, end_date to the trip date year
            // e.g. trip date 09/02/22, start_date 09/01/22, 04/30/22.
            // This step checks two variations, one where start_date changed, another where end_date changed, and returns true if trip date falls within either one
            // e.g. check against both 09/01/22 to 04/30/23, and 09/01/21 to 04/30/22

            // date 09/02/22, start 09/01/22, end 04/30/23
            endDate.setUTCFullYear(+year + 1);
            if (date >= startDate && date <= endDate) return true;

            // date 09/02/22, start 09/01/21, end 04/30/22
            startDate.setUTCFullYear(+year - 1);
            endDate.setUTCFullYear(+year);
            if (date >= startDate && date <= endDate) return true;
        }

        if (date >= startDate && date <= endDate) return true;

        return false;
    });
};

// Logging to check how rates are being parsed
// console.log(`______Date: ${date.toISOString().slice(0, 10)}`);
// console.log(`start_Date: ${startDate.toISOString().slice(0, 10)}`);
// console.log(`end___Date: ${endDate.toISOString().slice(0, 10)}`);
// console.log(`Checking if date >= start_Date && date <= end_Date`);
// console.log(date >= startDate && date <= endDate);
