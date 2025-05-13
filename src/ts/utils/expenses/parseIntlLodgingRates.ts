import type { DateRaw } from '../../types/dates';
import { returnValidYear } from '../dates';

export const parseIntlLodgingRates = (
    dateRaw: DateRaw,
    country: string,
    records: Element[],
) => {
    return records.find(record => {
        const year = returnValidYear(dateRaw);
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

        // Create dates for all date columns--because the start_date and end_date values don't have years, we are artificially adding them e.g. 01/15 -> 2024-01-15
        const date = new Date(dateRaw);
        const effDate = new Date(
            `${effDateText.split('/')[2]}-${effDateText.split('/')[0]}-${effDateText.split('/')[1]}`,
        );
        const expDate = new Date(
            `${expDateText.split('/')[2]}-${expDateText.split('/')[0]}-${expDateText.split('/')[1]}`,
        );
        const startDate = new Date(
            `${year}-${startDateText?.replace('/', '-')}`,
        );
        const endDate = new Date(`${year}-${endDateText?.replace('/', '-')}`);
        if (!(date && effDate && expDate && startDate && endDate))
            throw new Error(
                'Failed to create Date objects using date columns from XML records.',
            );

        // Some rates are effective from the end of one year to the start of the next e.g. 10/01 to 03/01. The previous step would've set start_date to 10/01/22 and end_date to 03/01/22. The below step will correct the year.
        if (date >= startDate && endDate < startDate) {
            // date 09/02, start 09/01, end 04/30
            endDate.setUTCFullYear(+year + 1); // date 09/02/25, start 09/01/25, end 04/30/26
        } else if (date <= endDate && endDate < startDate) {
            // date 03/31, start 09/01, end 04/30,
            startDate.setUTCFullYear(+year - 1); // date 03/31/25, start 09/01/24, end 04/30/25
        }
        console.log(`
            Date: ${date.toISOString().slice(0, 10)}\n
            effDate: ${effDate.toISOString().slice(0, 10)}\n
            expDate: ${expDate.toISOString().slice(0, 10)}\n
            startDate: ${startDate.toISOString().slice(0, 10)}\n
            endDate: ${endDate.toISOString().slice(0, 10)}\n
            VALID: ${
                countryText === country &&
                date >= effDate &&
                date <= expDate &&
                date >= startDate &&
                date <= endDate
            }`);
        return (
            countryText === country &&
            date >= effDate &&
            date <= expDate &&
            date >= startDate &&
            date <= endDate
        );
    });
};
