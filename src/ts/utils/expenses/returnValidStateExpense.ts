import {
    StateExpenseItemInclRates,
    StateExpenseItemValid,
} from '../../types/expenses';

export const returnValidStateExpense = (
    expense: StateExpenseItemInclRates,
): StateExpenseItemValid => {
    let source = '';
    const { date, country, city } = expense;

    // Domestic URL
    if (expense.country.length === 2) {
        const sourceMonth = +date.slice(5, 7);
        const sourceFiscalYear =
            sourceMonth < 10 ? +date.slice(0, 4) : +date.slice(0, 4) + 1;
        source = `https://www.gsa.gov/travel/plan-book/per-diem-rates/per-diem-rates-results?action=perdiems_report&fiscal_year=${sourceFiscalYear}&state=${country}&city=${city}`;

        // Intl URL
    } else {
        const todayDate = new Date();
        const todayMonth = todayDate.toISOString().slice(5, 7);
        const todayYear = todayDate.toISOString().slice(0, 4);
        const tripMonth = date.slice(5, 7);
        const tripYear = date.slice(0, 4);

        const sourceYear =
            +tripYear > +todayYear ?
                todayYear.slice(2, 4)
            :   tripYear.slice(2, 4);
        const sourceMonth =
            +tripYear > +todayYear ? todayMonth
            : +tripMonth > +todayMonth ? todayMonth
            : tripMonth;
        const sourceDate = `${sourceMonth}-01-${sourceYear}`;
        source = `https://www.defensetravel.dod.mil/neorates/report/index.php?report=oconus&country=${country}&date=${sourceDate}&military=YES`;
    }

    return { ...expense, source };
};
