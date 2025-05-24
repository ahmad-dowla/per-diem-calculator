// Types
import type {
    StateExpenseItemInclRates,
    StateExpenseItemValid,
} from '../../types/expenses';
import type { DateRaw } from '../../types/dates';

// Utils
import { getYYYY, getYY, getMM } from '../dates';
import { OCTOBER } from '../config';

const getGSAFiscalYear = (date: DateRaw) => {
    return +getMM(date) < OCTOBER ? +getYYYY(date) : +getYYYY(date) + 1;
};

const getDODSourceDate = (date: DateRaw) => {
    const todayDate = new Date();
    const todayMonth = getMM(todayDate.toISOString());
    const todayYear = getYYYY(todayDate.toISOString());

    const tripMonth = getMM(date);
    const tripYear = getYYYY(date);

    const sourceYear =
        +tripYear > +todayYear ? getYY(todayDate.toISOString()) : getYY(date);
    const sourceMonth =
        +tripYear > +todayYear ? todayMonth
        : +tripMonth > +todayMonth ? todayMonth
        : tripMonth;

    return `${sourceMonth}-01-${sourceYear}`;
};

export const returnValidStateExpense = (
    expense: StateExpenseItemInclRates,
): StateExpenseItemValid => {
    const { date, country, city } = expense;
    let source = '';
    if (expense.country.length === 2)
        // Domestic rates are state abbr like 'NY' with length 2
        source = `https://www.gsa.gov/travel/plan-book/per-diem-rates/per-diem-rates-results?action=perdiems_report&fiscal_year=${getGSAFiscalYear(date)}&state=${country}&city=${city}`;
    else
        source = `https://www.defensetravel.dod.mil/neorates/report/index.php?report=oconus&country=${country}&date=${getDODSourceDate(date)}&military=YES`;

    return { ...expense, source };
};
