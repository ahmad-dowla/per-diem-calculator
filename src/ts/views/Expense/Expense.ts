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
import { getDD, getMM, getYY, getYYYY, isDateRawType } from '../../utils/dates';

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
        rates: Set<StateExpenseItemValid>,
        sources: Set<string>,
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
            if (window.innerWidth >= SCREEN_WIDTH_LG) row.rowToggle('open');
        });
        const position = this.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: position, behavior: 'smooth' });
        await this.#updateTotals();
        this.#updateTotalsText();
        this.#createSourceList(sources);
        this.#createRatesTable(rates);
    }

    /* Create prinout
     */
    #createSourceList(sources: Set<string>) {
        const sourcesEl = this.#shadowRoot.querySelector('#sources');
        if (!sourcesEl)
            throw new Error(
                'Failed to render sources element in Expense view.',
            );
        sourcesEl.innerHTML = '';
        sources.forEach(source => {
            sourcesEl.insertAdjacentHTML(
                'beforeend',
                `<a href="${source}" target="_blank">${source}</a>`,
            );
        });
    }

    #createRatesTable(rates: Set<StateExpenseItemValid>) {
        const ratesTable = this.#shadowRoot.querySelector('#rates-table');
        const ratesRows = this.#shadowRoot.querySelector('#rates-rows');
        if (!(ratesTable && ratesRows))
            throw new Error('Failed to render rates elements in Expense view.');
        let tableMarkup = '';
        let rowsMarkup = /* HTML */ `
            <div
                class="hidden grid-cols-10 items-center border-b-2 border-b-neutral-300 bg-neutral-50 text-sm font-semibold *:p-2 lg:grid"
            >
                <div class="row-span-2">Eff. Date</div>
                <div
                    class="col-span-2 row-span-2 border-r border-r-neutral-300 !py-11"
                >
                    Location
                </div>
                <div
                    class="col-span-4 border-r border-b border-r-neutral-300 border-b-neutral-300"
                >
                    Maximums
                </div>
                <div class="col-span-3 border-b border-b-neutral-300">
                    Deductions
                </div>
                <div>Lodging</div>
                <div>M&IE<br /><span class="font-normal">Full</span></div>
                <div>M&IE<br /><span class="font-normal">First/Last</span></div>
                <div class="border-r border-r-neutral-300 !py-6">Incid.</div>
                <div>Break.</div>
                <div>Lunch</div>
                <div>Dinner</div>
            </div>
        `;
        [...rates].forEach((expense, i) => {
            tableMarkup += /* HTML */ `
                <tr class="border-b-2">
                    <td class="border-r-2 p-3">
                        ${getMM(expense.date)}/${getYYYY(expense.date)}
                    </td>
                    <td class="border-r-2 p-3">
                        ${expense.city}, ${expense.country}
                    </td>
                    <td>${expense.rates.maxLodging.toFixed(2)}</td>
                    <td>${expense.rates.maxMie.toFixed(2)}</td>
                    <td>${expense.rates.maxMieFirstLast.toFixed(2)}</td>
                    <td class="border-r-2">
                        ${expense.rates.maxIncidental.toFixed(2)}
                    </td>
                    <td>${expense.rates.deductionBreakfast.toFixed(2)}</td>
                    <td>${expense.rates.deductionLunch.toFixed(2)}</td>
                    <td>${expense.rates.deductionDinner.toFixed(2)}</td>
                </tr>
            `;
            const bgColor = i % 2 === 0 ? 'bg-white' : 'bg-neutral-50';
            const oppColor =
                bgColor === 'bg-white' ? 'bg-neutral-50' : 'bg-white';

            rowsMarkup += /* HTML */ `
                <details
                    class="${oppColor} border-b-2 border-b-neutral-300 p-4 lg:hidden"
                >
                    <summary class="truncate">
                        <p class="ml-3 inline text-sm">
                            ${getMM(expense.date)}/${getYYYY(expense.date)}
                        </p>
                        <p class="ml-3 inline">
                            ${expense.city}, ${expense.country}
                        </p>
                    </summary>
                    <p class="p-2 pt-5 pb-0 font-semibold">Maximums</p>
                    <div
                        class="grid grid-cols-3 p-2 *:p-2 *:pb-0 [&_p]:text-right"
                    >
                        <label class="col-span-2 !pt-0">Lodging</label>
                        <p class="!pt-0">
                            ${USD.format(expense.rates.maxLodging)}
                        </p>
                        <label class="col-span-2">M&IE (Full)</label>
                        <p>${USD.format(expense.rates.maxMie)}</p>
                        <label class="col-span-2">M&IE (First/Last)</label>
                        <p>${USD.format(expense.rates.maxMieFirstLast)}</p>
                        <label class="col-span-2">Incid.</label>
                        <p>${USD.format(expense.rates.maxIncidental)}</p>
                    </div>
                    <p class="p-2 pt-5 pb-0 font-semibold">Deductions</p>
                    <div
                        class="grid grid-cols-3 p-2 *:p-2 *:pb-0 [&_p]:text-right"
                    >
                        <label class="col-span-2 !pt-0">Breakfast</label>
                        <p class="!pt-0">
                            ${USD.format(expense.rates.deductionBreakfast)}
                        </p>
                        <label class="col-span-2">Lunch</label>
                        <p>${USD.format(expense.rates.deductionLunch)}</p>
                        <label class="col-span-2">Dinner</label>
                        <p>${USD.format(expense.rates.deductionDinner)}</p>
                    </div>
                    <p class="p-2 pt-5 pb-0 font-semibold">Source</p>
                    <a
                        class="mb-5 ml-4 block truncate pb-2 underline underline-offset-8"
                        href="${expense.source}"
                        target="_blank"
                        aria-label="Link to source for ${expense.date} ${expense.city} rates"
                        >${expense.source}</a
                    >
                </details>
                <div
                    class="${bgColor} hidden grid-cols-10 items-center border-b-1 border-b-neutral-300 *:p-6 *:pb-0 lg:grid"
                >
                    <div>${getMM(expense.date)}/${getYYYY(expense.date)}</div>
                    <div class="col-span-2 truncate">
                        ${expense.city}, ${expense.country}
                    </div>
                    <div>${expense.rates.maxLodging.toFixed(2)}</div>
                    <div>${expense.rates.maxMie.toFixed(2)}</div>
                    <div>${expense.rates.maxMieFirstLast.toFixed(2)}</div>
                    <div>${expense.rates.maxIncidental.toFixed(2)}</div>
                    <div>${expense.rates.deductionBreakfast.toFixed(2)}</div>
                    <div>${expense.rates.deductionLunch.toFixed(2)}</div>
                    <div>${expense.rates.deductionDinner.toFixed(2)}</div>
                    <div
                        class="col-span-10 mt-4 truncate border-t border-t-neutral-100 !py-4 !text-left text-sm"
                    >
                        <a
                            class="pb-2 text-neutral-500 underline underline-offset-8 transition-colors hover:text-neutral-800"
                            href="${expense.source}"
                            target="_blank"
                            aria-label="Link to source for ${expense.date} ${expense.city} rates"
                            >${expense.source}</a
                        >
                    </div>
                </div>
            `;
        });
        ratesTable.innerHTML = tableMarkup;
        ratesRows.innerHTML = rowsMarkup;
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
