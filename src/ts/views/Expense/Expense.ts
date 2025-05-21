// TODO3 Language like "for each day, indicate if you  were provided meals, update your lodging amount"

// Types
import type { DateRaw } from '../../types/dates';
import {
    StateExpenseItemValid,
    StateExpenseItemUpdate,
    ExpenseRateTableRow,
} from '../../types/expenses';

// Utils
import {
    USD,
    handlePointerDown,
    handlePointerUp,
    debounce,
    wait,
} from '../../utils/misc';
import { applyStyles, removeStyles } from '../../utils/styles';
import { isDateRawType } from '../../utils/dates';

// HTML/CSS
import templateHTML from './template.html?raw';

// Custom Elements
import { PdcExpenseRow, PdcButtonText, PdcLabel } from '../../components';
customElements.define('pdc-expense-row', PdcExpenseRow);

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcExpenseView extends HTMLElement {
    #styled: boolean = false;
    #observer: MutationObserver | null = null;
    #mieSubtotal = 0;
    #lodgingSubtotal = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /* View render methods
     */

    render(styled: boolean) {
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for location View.`);
        if (this.shadowRoot !== null) this.shadowRoot.innerHTML = '';

        const handleResize = () => {
            const rows =
                this.#getViewEls().viewContainer?.querySelectorAll<PdcExpenseRow>(
                    'pdc-expense-row',
                );
            rows?.forEach(row => row.windowResize());
        };
        const debouncedHandleResize = debounce(handleResize, 300);
        window.removeEventListener('resize', debouncedHandleResize);

        this.#styled = styled;
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        /* Event listeners
         */

        // Mouse, touch events
        let pointerStartX = 0;
        let pointerStartY = 0;
        this.#getViewEls().viewContainer.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;

            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        this.#getViewEls().viewContainer.addEventListener('pointerup', e => {
            if (e instanceof PointerEvent) {
                const result = handlePointerUp(
                    e,
                    this.#handleClicks.bind(this),
                    pointerStartX,
                    pointerStartY,
                );
                pointerStartX = result.pointerStartX;
                pointerStartY = result.pointerStartY;
            }
        });

        // Keyboard events
        this.#getViewEls().viewContainer.addEventListener('keydown', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });

        // Resize events
        window.addEventListener('resize', debouncedHandleResize);
    }

    renderLoadingSpinner(enabled: boolean) {
        if (!this.#styled) return;
        const spinner = this.shadowRoot?.querySelector(
            '[data-pdc="loading-spinner"]',
        );
        enabled ?
            spinner?.classList.add('active')
        :   spinner?.classList.remove('active');
    }

    /* Event handlers
     */
    #handleClicks(e: Event) {
        const target = e.target;
        if (!(target instanceof Element || target instanceof SVGElement))
            return;
        const btn = target.closest('button');
        const btnPdcEl = target.closest<PdcButtonText>('pdc-button-text');
        if (!(btn || btnPdcEl)) return;
        switch (true) {
            case btn?.getAttribute('id') === 'toggle-expand':
                this.#expandAllRows(btn);
                return;
            case btnPdcEl?.getAttribute('id') === 'print-expenses':
                this.#getViewEls().viewContainer.setAttribute('table', 'true');
                return;
            default:
                return;
        }
    }

    /* Getters for elements needed in multiple methods
     */
    #getViewEls = () => {
        const viewContainer =
            this.shadowRoot?.querySelector<HTMLElement>('#expense-container');
        const expensesTable = this.shadowRoot?.querySelector('#expenses-table');
        const rows =
            this.shadowRoot?.querySelectorAll<PdcExpenseRow>('pdc-expense-row');
        if (!(viewContainer && expensesTable && rows))
            throw new Error('Failed to render elements for location View.');

        return {
            viewContainer,
            expensesTable,
            rows,
        };
    };

    /* Row update methods
     */

    #updateTotals() {
        const mieSubtotalEl = this.shadowRoot?.querySelector('#mie-subtotal');
        const lodgingSubtotalEl =
            this.shadowRoot?.querySelector('#lodging-subtotal');
        const totalEl = this.shadowRoot?.querySelector('#total');
        if (!(mieSubtotalEl && lodgingSubtotalEl && totalEl))
            throw new Error(
                'Failed to render subtotal/total elements in Expense view.',
            );
        mieSubtotalEl.textContent = `${USD.format(this.#mieSubtotal)}`;
        lodgingSubtotalEl.textContent = `${USD.format(this.#lodgingSubtotal)}`;
        totalEl.textContent = `${USD.format(this.#mieSubtotal + this.#lodgingSubtotal)}`;
    }

    updateRowMie(
        date: DateRaw,
        newMieTotal: number,
        totalMie: number,
        totalLodging: number,
    ) {
        this.shadowRoot
            ?.querySelector<PdcExpenseRow>(`[date="${date}"]`)
            ?.updateMieAmount(newMieTotal);
        this.#mieSubtotal = totalMie;
        this.#lodgingSubtotal = totalLodging;
        this.#updateTotals();
    }

    #createSourceList() {
        const sources = new Set<string>();
        this.#getViewEls().rows?.forEach(row => {
            sources.add(row.getSource());
        });
        const sourcesEl = this.shadowRoot?.querySelector('#sources');
        sourcesEl &&
            sources.forEach(source => {
                sourcesEl.insertAdjacentHTML(
                    'beforeend',
                    `<a href="${source}" target="_blank">${source}</a>`,
                );
            });
    }

    #createRateTableMarkup(item: string) {
        const rate: ExpenseRateTableRow = JSON.parse(item);
        const { monthYear, country, city } = rate;
        const {
            maxLodging,
            maxMie,
            maxMieFirstLast,
            maxIncidental,
            deductionBreakfast,
            deductionLunch,
            deductionDinner,
        } = rate.rates;

        return /*HTML*/ `
            <tr class="border-b-2">
                <td class="border-r-2 p-3">${monthYear}</td>
                <td class="border-r-2 p-3">${city}, ${country}</td>
                <td>${maxLodging.toFixed(2)}</td>
                <td>${maxMie.toFixed(2)}</td>
                <td>${maxMieFirstLast.toFixed(2)}</td>
                <td class="border-r-2">${maxIncidental.toFixed(2)}</td>
                <td>${deductionBreakfast.toFixed(2)}</td>
                <td>${deductionLunch.toFixed(2)}</td>
                <td>${deductionDinner.toFixed(2)}</td>
            </tr>
        `;
    }

    #createRatesTable() {
        const ratesTable = this.shadowRoot?.querySelector('#rates-table');
        const rateSet = new Set<string>();
        const createRateData = (
            city: string,
            country: string,
            rates: object,
        ) => {
            return JSON.stringify({ city, country, rates });
        };
        this.#getViewEls().rows.forEach((row, i, arr) => {
            const { date, country, city, rates } = row.getRateTableDate();
            const rateData = createRateData(city, country, rates);
            const monthYear = `${date.slice(5, 7)}/${date.slice(0, 4)}`;
            if (i === 0) rateSet.add(JSON.stringify({ monthYear, rateData }));
            if (i > 0) {
                const {
                    country: prevCountry,
                    city: prevCity,
                    rates: prevRates,
                } = arr[i - 1].getRateTableDate();
                const prevRateData = createRateData(
                    prevCity,
                    prevCountry,
                    prevRates,
                );
                if (rateData === prevRateData) return;
                rateSet.add(JSON.stringify({ monthYear, rateData }));
            }
        });
        rateSet.forEach(item => {
            ratesTable?.insertAdjacentHTML(
                'beforeend',
                this.#createRateTableMarkup(item),
            );
        });
    }

    async #updateSubtotals() {
        this.#mieSubtotal = 0;
        this.#lodgingSubtotal = 0;
        this.#getViewEls().rows.forEach(row => {
            this.#mieSubtotal += row.getAmounts().mieAmount;
            this.#lodgingSubtotal += row.getAmounts().lodgingAmount;
        });
    }

    async addRows(
        expenses: StateExpenseItemValid[],
        expensesCategory: 'mie' | 'lodging' | 'both',
    ) {
        const rowsContainer =
            this.shadowRoot?.querySelector<HTMLDivElement>('#rows');
        if (!rowsContainer)
            throw new Error(
                'Failed to render row container/rates table in Expense view.',
            );
        rowsContainer.innerHTML = '';

        expenses.forEach(expense => {
            const row = new PdcExpenseRow(
                expense,
                this.#styled,
                expensesCategory,
            );
            rowsContainer.appendChild(row);
            row.setRowBgColor();
        });
        const position = this.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: position, behavior: 'smooth' });

        await this.#updateSubtotals();
        this.#updateTotals();
    }

    /* Row visual methods
     */

    #expandAllRows(btn: HTMLButtonElement) {
        if (!this.#styled) return;
        btn.classList.toggle('active');
        const toggle = btn.classList.contains('active') ? 'open' : 'close';
        const rows =
            this.shadowRoot?.querySelectorAll<PdcExpenseRow>('pdc-expense-row');
        rows?.forEach(row => row.rowToggle(toggle));
    }

    renderEmtpy() {
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for location View.`);
        this.shadowRoot.innerHTML = '';
    }

    controllerHandler(
        controlUpdateFunction: Function,
        controlTableFunction: Function,
    ) {
        this.#observer?.disconnect();
        const { viewContainer } = this.#getViewEls();
        const observerOptions = {
            subtree: true,
            attributes: true,
            attributeFilter: [
                'lodging',
                'breakfastprovided',
                'lunchprovided',
                'dinnerprovided',
                'table',
            ],
        };
        const callback = (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                const changedAttr = mutation.attributeName;
                if (!(changedAttr && mutation.target instanceof Element))
                    return;
                const target = mutation.target;
                const newValue = target.getAttribute(changedAttr);
                if (changedAttr === 'table') {
                    if (!!newValue) {
                        viewContainer.removeAttribute('table');
                        controlTableFunction();
                    }
                    return;
                }
                const result = this.#returnRowUpdate(target);
                controlUpdateFunction(result);
                return;
            });
        };
        if (this.#observer === null)
            this.#observer = new MutationObserver(callback);
        this.#observer.observe(viewContainer, observerOptions);
    }

    #returnRowUpdate(target: Element): StateExpenseItemUpdate {
        const row = target.closest<Element>('pdc-expense-row');
        const date = row?.getAttribute('date');
        const lodging = row?.getAttribute('lodging');
        const breakfastProvided =
            row?.getAttribute('breakfastprovided') === 'yes';
        const lunchProvided = row?.getAttribute('lunchprovided') === 'yes';
        const dinnerProvided = row?.getAttribute('dinnerprovided') === 'yes';

        if (!(date && isDateRawType(date) && lodging))
            throw new Error(
                'Failed to get date and lodging values to update row in expense View.',
            );

        return {
            date,
            lodgingAmount: +lodging,
            breakfastProvided,
            lunchProvided,
            dinnerProvided,
        };
    }

    createExpenseTable(expenses: StateExpenseItemValid[]) {
        const { expensesTable } = this.#getViewEls();

        let mieTotal = 0;
        let lodgingTotal = 0;
        let total = 0;

        expenses.forEach((expense, i, arr) => {
            const {
                date,
                city,
                country,
                mieAmount,
                lodgingAmount,
                totalAmount,
            } = expense;
            mieTotal += mieAmount;
            lodgingTotal += lodgingAmount;
            total += totalAmount;

            const { breakfastProvided, lunchProvided, dinnerProvided } =
                expense.deductions;
            const deductions: string[] = [];
            if (i === 0) deductions.push('First Day');
            if (i === arr.length - 1) deductions.push('Last Day');
            if (breakfastProvided) deductions.push('Breakfast');
            if (lunchProvided) deductions.push('Lunch');
            if (dinnerProvided) deductions.push('Dinner');

            const dateText = `${date.slice(5).replaceAll('-', '/')}/${date.slice(2, 4)}`; // 2024-10-01 to 10/01/24
            const deductionsText = deductions.reduce((result, deduction) => {
                return result === '' ? deduction : `${result}, ${deduction}`;
            }, '');
            const locationText =
                deductionsText !== '' ?
                    `<span class="font-semibold">${city}, ${country}</span><br>${deductionsText}`
                :   `<span class="font-semibold">${city}, ${country}</span>`;

            expensesTable.insertAdjacentHTML(
                'beforeend',
                /*HTML*/ `
                <tr>
                    <td class=" text-center">${dateText}</td>
                    <td class=" text-left">${locationText}</td>
                    <td class="text-right">${USD.format(mieAmount)}</td>
                    <td class="text-right">${USD.format(lodgingAmount)}</td>
                    <td class="text-right font-semibold">${USD.format(totalAmount)}</td>
                </tr>
            `,
            );
        });

        setTimeout(() => {
            expensesTable.insertAdjacentHTML(
                'beforeend',
                /* HTML */ `
                    <tr class="border-t-3 *:text-lg *:font-semibold">
                        <td colspan="2" class="text-left">Total</td>
                        <td class="text-right">${USD.format(mieTotal)}</td>
                        <td class="text-right">${USD.format(lodgingTotal)}</td>
                        <td class="text-right">${USD.format(total)}</td>
                    </tr>
                `,
            );
            window.print();
        }, 0);
    }

    emptyExpenseTable() {
        const { expensesTable } = this.#getViewEls();
        expensesTable.innerHTML = '';
    }
}
