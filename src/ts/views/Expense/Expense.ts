// Types
import type { DateRaw } from '../../types/dates';
import {
    StateExpenseItemValid,
    StateExpenseItemUpdate,
} from '../../types/expenses';
import type { ConfigSectionText } from '../../types/config';

// Utils
import {
    USD,
    handlePointerDown,
    handlePointerUp,
    debounce,
    wait,
} from '../../utils/misc';
import { applyStyles, removeStyles } from '../../utils/styles';
import { getDD, getMM, getYY, isDateRawType } from '../../utils/dates';

// HTML/CSS
import templateHTML from './template.html?raw';

// Custom Elements
import { PdcExpenseRow, PdcButton } from '../../components';
import { SCREEN_WIDTH_LG } from '../../utils/config';
customElements.define('pdc-expense-row', PdcExpenseRow);

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcExpenseView extends HTMLElement {
    /* Initial setup
     */
    #styled = false;
    #observer: MutationObserver | null = null;
    #mieSubtotal = 0;
    #lodgingSubtotal = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    render(styled: boolean, config: ConfigSectionText) {
        this.#shadowRoot.innerHTML = '';
        window.removeEventListener('resize', this.#debouncedResizeHandler());
        this.#styled = styled;
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.#shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.#shadowRoot.appendChild(template.content.cloneNode(true));
        this.#applyConfig(config);
        this.#shadowRoot
            .querySelector<PdcButton>('pdc-button')
            ?.enableTabIndex(true);
        this.#addEventListeners();
    }

    renderLoadingSpinner(enabled: boolean) {
        if (!this.#styled) return;
        const spinner = this.#shadowRoot.querySelector(
            '[data-pdc="loading-spinner"]',
        );
        if (enabled) spinner?.classList.add('active');
        else spinner?.classList.remove('active');
    }

    #applyConfig = (config: ConfigSectionText) => {
        const heading = this.#shadowRoot.querySelector('#heading');
        const headingPrint = this.#shadowRoot.querySelector('#heading-print');
        const body = this.#shadowRoot.querySelector('#body');
        const bodyPrint = this.#shadowRoot.querySelector('#body-print');

        if (heading && config.heading) {
            heading.innerHTML = '';
            heading.insertAdjacentHTML('beforeend', config.heading);
        } else heading?.remove();

        if (headingPrint && config.headingPrint) {
            headingPrint.innerHTML = '';
            headingPrint.insertAdjacentHTML('beforeend', config.headingPrint);
        } else headingPrint?.remove();

        if (body && config.body) {
            body.innerHTML = '';
            body.insertAdjacentHTML('beforeend', config.body);
        } else body?.remove();

        if (bodyPrint && config.bodyPrint) {
            bodyPrint.innerHTML = '';
            bodyPrint.insertAdjacentHTML('beforeend', config.bodyPrint);
        } else bodyPrint?.remove();
    };

    /* Events
     */
    #addEventListeners() {
        // Mouse, touch events
        let pointerStartX = 0;
        let pointerStartY = 0;
        this.#viewContainer.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;

            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        this.#viewContainer.addEventListener('pointerup', e => {
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
        this.#viewContainer.addEventListener('keydown', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });

        // Resize events
        window.addEventListener('resize', this.#debouncedResizeHandler());
    }

    #debouncedResizeHandler() {
        const resizeHandler = () => {
            this.#rows.forEach(row => row.resizeRow());
        };
        return debounce(resizeHandler);
    }

    #handleClicks(e: Event) {
        const target = e.target;
        if (!(target instanceof Element || target instanceof SVGElement))
            return;
        const btn = target.closest('button');
        const btnPdcEl = target.closest<PdcButton>('pdc-button');
        if (!(btn || btnPdcEl)) return;
        switch (true) {
            case btn?.getAttribute('id') === 'toggle-expand':
                this.#expandAllRows(btn);
                return;
            case btnPdcEl?.getAttribute('id') === 'save-expenses':
                this.#viewContainer.setAttribute('table', 'true');
                return;
            default:
                return;
        }
    }

    /* Get view elements
     */
    get #rowsContainer() {
        const rowsContainer =
            this.#shadowRoot.querySelector<HTMLDivElement>('#rows');
        if (!rowsContainer)
            throw new Error(
                'Failed to render row container/rates table in Expense view.',
            );
        return rowsContainer;
    }

    get #rows() {
        const rows =
            this.#shadowRoot.querySelectorAll<PdcExpenseRow>('pdc-expense-row');
        if (!rows)
            throw new Error('Failed to render row elements for expense View.');
        return rows;
    }

    get #viewContainer() {
        const container =
            this.#shadowRoot.querySelector<HTMLElement>('#expense-container');
        if (!container)
            throw new Error(
                'Failed to render container element for expense View.',
            );
        return container;
    }

    get #expensesTable() {
        const expensesTable = this.#shadowRoot.querySelector('#expenses-table');
        if (!expensesTable)
            throw new Error(
                'Failed to render expenses table for expense View.',
            );
        return expensesTable;
    }

    get #shadowRoot() {
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for expense View.`);
        return this.shadowRoot;
    }

    /* Visual methods
     */
    #expandAllRows(btn: HTMLButtonElement) {
        if (!this.#styled) return;
        btn.classList.toggle('active');
        const toggle = btn.classList.contains('active') ? 'open' : 'close';
        this.#rows.forEach(row => row.rowToggle(toggle));
    }

    renderEmtpy() {
        this.#shadowRoot.innerHTML = '';
    }

    /* Update methods
     */
    async #updateTotals() {
        this.#mieSubtotal = 0;
        this.#lodgingSubtotal = 0;
        this.#rows.forEach(row => {
            this.#mieSubtotal += row.amount.mie;
            this.#lodgingSubtotal += row.amount.lodging;
        });
    }

    #updateTotalsText() {
        const mieSubtotalEl = this.#shadowRoot.querySelector('#mie-subtotal');
        const lodgingSubtotalEl =
            this.#shadowRoot.querySelector('#lodging-subtotal');
        const totalEl = this.#shadowRoot.querySelector('#total');
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
        this.#shadowRoot
            .querySelector<PdcExpenseRow>(`[date="${date}"]`)
            ?.updateMieAmount(newMieTotal);
        this.#mieSubtotal = totalMie;
        this.#lodgingSubtotal = totalLodging;
        this.#updateTotalsText();
    }

    async addRows(
        expenses: StateExpenseItemValid[],
        expensesCategory: 'mie' | 'lodging' | 'both',
    ) {
        this.#rowsContainer.innerHTML = '';
        expenses.forEach(expense => {
            const row = new PdcExpenseRow(
                expense,
                this.#styled,
                expensesCategory,
            );
            this.#rowsContainer.appendChild(row);
            row.styleRow();
            if (window.screen.width >= SCREEN_WIDTH_LG) row.rowToggle('open');
        });
        const position = this.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: position, behavior: 'smooth' });
        await this.#updateTotals();
        this.#updateTotalsText();
        this.#createSourceList();
        this.#createRatesTable();
    }

    /* Create prinout
     */
    #createSourceList() {
        const sources = new Set<string>();
        this.#rows?.forEach(row => {
            sources.add(row.rateSource);
        });
        const sourcesEl = this.#shadowRoot.querySelector('#sources');
        if (!sourcesEl)
            throw new Error(
                'Failed to render sources element in Expense view.',
            );
        sources.forEach(source => {
            sourcesEl.insertAdjacentHTML(
                'beforeend',
                `<a href="${source}" target="_blank">${source}</a>`,
            );
        });
    }

    #createRatesTable() {
        const ratesTable = this.#shadowRoot.querySelector('#rates-table');
        if (!ratesTable)
            throw new Error('Failed to render rates table in Expense view.');

        const rateSet = new Set<string>();
        this.#rows.forEach((row, i, arr) => {
            if (i === 0 || row.rateString !== arr[i - 1].rateString)
                rateSet.add(row.rateStringForTable);
        });

        let markup = '';
        rateSet.forEach(item => {
            markup += this.#createRateTableMarkup(item);
        });

        ratesTable.innerHTML = markup;
    }

    #createRateTableMarkup(item: string) {
        const rateObject = JSON.parse(item);
        const { rates } = rateObject;
        return /*HTML*/ `
            <tr class="border-b-2">
                <td class="border-r-2 p-3">${rateObject.monthYear}</td>
                <td class="border-r-2 p-3">${rateObject.city}, ${rateObject.country}</td>
                <td>${rates.maxLodging.toFixed(2)}</td>
                <td>${rates.maxMie.toFixed(2)}</td>
                <td>${rates.maxMieFirstLast.toFixed(2)}</td>
                <td class="border-r-2">${rates.maxIncidental.toFixed(2)}</td>
                <td>${rates.deductionBreakfast.toFixed(2)}</td>
                <td>${rates.deductionLunch.toFixed(2)}</td>
                <td>${rates.deductionDinner.toFixed(2)}</td>
            </tr>
        `;
    }

    async createExpenseTable(expenses: StateExpenseItemValid[]) {
        let mieTotal = 0;
        let lodgingTotal = 0;
        let total = 0;
        let markup = '';

        expenses.forEach((expense, i, arr) => {
            mieTotal += expense.mieAmount;
            lodgingTotal += expense.lodgingAmount;
            total += expense.totalAmount;
            const locationString =
                `<span class="font-semibold">${expense.city}, ${expense.country}</span>` +
                this.#createDeductionsString(expense, i, arr.length);

            markup += this.#createExpenseTableRow(expense, locationString);
        });

        markup += /* HTML */ `
            <tr class="border-t-3 *:text-lg *:font-semibold">
                <td colspan="2" class="text-left">Total</td>
                <td class="text-right">${USD.format(mieTotal)}</td>
                <td class="text-right">${USD.format(lodgingTotal)}</td>
                <td class="text-right">${USD.format(total)}</td>
            </tr>
        `;
        this.#expensesTable.innerHTML = markup;
        await wait(0);
        window.print();
    }

    #createDeductionsString(
        expense: StateExpenseItemValid,
        i: number,
        arrLength: number,
    ) {
        const { breakfastProvided, lunchProvided, dinnerProvided } =
            expense.deductions;
        const deductionsArr: string[] = [];
        if (i === 0) deductionsArr.push('First Day');
        if (i === arrLength - 1) deductionsArr.push('Last Day');
        if (breakfastProvided) deductionsArr.push('Breakfast');
        if (lunchProvided) deductionsArr.push('Lunch');
        if (dinnerProvided) deductionsArr.push('Dinner');
        return deductionsArr.length === 0 ?
                ''
            :   deductionsArr.reduce((result, deduction) => {
                    return result === '' ?
                            `<br>${deduction}`
                        :   `${result}, ${deduction}`;
                }, '');
    }

    #createExpenseTableRow(expense: StateExpenseItemValid, location: string) {
        return /*HTML*/ `
            <tr>
                <td class="text-center">${getMM(expense.date)}/${getDD(expense.date)}/${getYY(expense.date)}</td> <!-- // 2024-10-01 to 10/01/24 -->
                <td class="text-left">${location}</td>
                <td class="text-right">${USD.format(expense.mieAmount)}</td>
                <td class="text-right">${USD.format(expense.lodgingAmount)}</td>
                <td class="text-right font-semibold">${USD.format(expense.totalAmount)}</td>
            </tr>
        `;
    }

    emptyExpenseTable() {
        this.#expensesTable.innerHTML = '';
    }

    /* Controller / View interaction
     */
    controllerHandler(
        controlUpdateFunction: (row: StateExpenseItemUpdate) => void,
        controlTableFunction: () => void,
    ) {
        const callback = (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                const changedAttr = mutation.attributeName;
                if (!(changedAttr && mutation.target instanceof Element))
                    return;
                const target = mutation.target;
                const newValue = target.getAttribute(changedAttr);
                if (changedAttr === 'table') {
                    if (newValue) {
                        this.#viewContainer.removeAttribute('table');
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
        this.#observer.disconnect();
        this.#observer.observe(this.#viewContainer, {
            subtree: true,
            attributes: true,
            attributeFilter: [
                'lodging',
                'breakfastprovided',
                'lunchprovided',
                'dinnerprovided',
                'table',
            ],
        });
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
}
