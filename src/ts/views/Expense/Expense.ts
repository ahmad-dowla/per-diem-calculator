// TODO3 Language like "for each day, indicate if you  were provided meals, update your lodging amount"

// Types
import type { DateRaw } from '../../types/dates';
import {
    StateExpenseItemValid,
    StateExpenseItemUpdate,
    ExpenseRateTableRow,
} from '../../types/expenses';
import type { ConfigSectionText } from '../../types/config';

// Utils
import {
    USD,
    handlePointerDown,
    handlePointerUp,
    debounce,
} from '../../utils/misc';
import { applyStyles, removeStyles } from '../../utils/styles';
import { isDateRawType } from '../../utils/dates';

// HTML/CSS
import templateHTML from './template.html?raw';

// Custom Elements
import { PdcExpenseRow, PdcButtonText } from '../../components';
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

    render(styled: boolean, config: ConfigSectionText) {
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for location View.`);
        if (this.shadowRoot !== null) this.shadowRoot.innerHTML = '';

        const handleResize = () => {
            const rows =
                viewContainer?.querySelectorAll<PdcExpenseRow>(
                    'pdc-expense-row',
                );
            rows?.forEach(row => row.toggleRow('resize'));
        };
        const debouncedHandleResize = debounce(handleResize, 300);
        window.removeEventListener('resize', debouncedHandleResize);

        this.#styled = styled;
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        const { viewContainer } = this.#getViewEls();

        this.#applyConfig(config);

        // Event listeners for the delete location, add location, and generate expenses buttons
        // Pointer events (mouse, touch)
        let pointerStartX = 0;
        let pointerStartY = 0;
        viewContainer?.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;

            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        viewContainer?.addEventListener('pointerup', e => {
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
        viewContainer.addEventListener('keyup', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });

        window.addEventListener('resize', debouncedHandleResize);
    }

    #getViewEls = () => {
        const heading =
            this.shadowRoot?.querySelector<HTMLHeadingElement>('#heading');
        const headingPrint =
            this.shadowRoot?.querySelector<HTMLHeadingElement>(
                '#heading-print',
            );
        const body =
            this.shadowRoot?.querySelector<HTMLParagraphElement>('#body');
        const bodyPrint =
            this.shadowRoot?.querySelector<HTMLParagraphElement>('#body-print');
        const viewContainer =
            this.shadowRoot?.querySelector<HTMLElement>('#expense-container');
        const rowsContainer =
            this.shadowRoot?.querySelector<HTMLDivElement>('#rows');
        const mieSubtotalEl = this.shadowRoot?.querySelector('#mie-subtotal');
        const lodgingSubtotalEl =
            this.shadowRoot?.querySelector('#lodging-subtotal');
        const totalEl = this.shadowRoot?.querySelector('#total');
        const ratesTable = this.shadowRoot?.querySelector('#rates-table');
        const expensesTable = this.shadowRoot?.querySelector('#expenses-table');

        if (
            !(
                heading &&
                viewContainer &&
                rowsContainer &&
                mieSubtotalEl &&
                lodgingSubtotalEl &&
                totalEl &&
                ratesTable &&
                expensesTable
            )
        )
            throw new Error('Failed to render elements for location View.');

        return {
            heading,
            headingPrint,
            body,
            bodyPrint,
            viewContainer,
            rowsContainer,
            mieSubtotalEl,
            lodgingSubtotalEl,
            totalEl,
            ratesTable,
            expensesTable,
        };
    };

    #applyConfig = (config: ConfigSectionText) => {
        const { heading, headingPrint, body, bodyPrint } = this.#getViewEls();
        if (config.heading) {
            heading.innerHTML = '';
            heading.insertAdjacentHTML('beforeend', config.heading);
        } else heading.remove();

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

    #handleClicks(e: Event) {
        const target = e.target;
        if (!(target instanceof Element || target instanceof SVGElement))
            return;
        const btn = target.closest('button');
        const btnText = target.closest<PdcButtonText>('pdc-button-text');
        const { viewContainer } = this.#getViewEls();
        if (!(btn || btnText)) return;
        switch (true) {
            case btn?.getAttribute('id') === 'toggle-expand':
                if (this.#styled) this.#expandAllRows(btn);
                break;
            case btnText?.getAttribute('id') === 'print-expenses':
                viewContainer.setAttribute('table', 'true');
                break;
            default:
                break;
        }
    }

    #expandAllRows(btn: HTMLButtonElement) {
        btn.classList.toggle('active');
        const toggle = btn.classList.contains('active') ? 'open' : 'close';
        const rows =
            this.shadowRoot?.querySelectorAll<PdcExpenseRow>('pdc-expense-row');
        rows?.forEach(row => row.toggleRow(toggle));
    }

    renderLoadingSpinner(enabled: boolean) {
        if (!this.#styled) return;
        const { viewContainer } = this.#getViewEls();
        enabled ?
            viewContainer.classList.remove('active')
        :   viewContainer.classList.add('active');
    }

    renderEmtpy() {
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for location View.`);
        this.shadowRoot.innerHTML = '';
    }

    addRows(
        expenses: StateExpenseItemValid[],
        expensesCategory: 'mie' | 'lodging' | 'both',
    ) {
        this.#mieSubtotal = 0;
        this.#lodgingSubtotal = 0;

        const { rowsContainer, ratesTable } = this.#getViewEls();
        rowsContainer.innerHTML = '';
        const rows: PdcExpenseRow[] = [];
        const rates = new Set<string>();
        const sources = new Set<string>();
        expenses.forEach((expense, i, arr) => {
            const row = new PdcExpenseRow(
                expense,
                this.#styled,
                expensesCategory,
            );
            rowsContainer.appendChild(row);
            this.#mieSubtotal += expense.mieAmount;
            this.#lodgingSubtotal += expense.lodgingAmount;
            rows.push(row);

            sources.add(expense.source);

            const { date, country, city } = expense;
            const monthYear = `${date.slice(5, 7)}/${date.slice(0, 4)}`;
            const createRateTableData = (expense: StateExpenseItemValid) => {
                const { effDate: _, ...rates } = expense.rates;
                return {
                    city,
                    country,
                    rates,
                };
            };

            if (
                i === 0 ||
                JSON.stringify(createRateTableData(expense)) !==
                    JSON.stringify(createRateTableData(arr[i - 1]))
            ) {
                rates.add(
                    JSON.stringify({
                        monthYear,
                        ...createRateTableData(expense),
                    }),
                );
            }
        });
        rows[0].updateFirstLastDay('first');
        rows[rows.length - 1].updateFirstLastDay('last');
        const position = this.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: position, behavior: 'smooth' });

        const sourcesEl = this.shadowRoot?.querySelector('#sources');
        sourcesEl &&
            sources.forEach(source => {
                sourcesEl.insertAdjacentHTML(
                    'beforeend',
                    `<a href="${source}" target="_blank">${source}</a>`,
                );
            });

        rates.forEach(item => {
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

            const markup = /*HTML*/ `
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
            ratesTable.insertAdjacentHTML('beforeend', markup);
        });

        this.#updateTotals();
    }

    #updateTotals() {
        const { mieSubtotalEl, lodgingSubtotalEl, totalEl } =
            this.#getViewEls();
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
        const row = this.shadowRoot?.querySelector<PdcExpenseRow>(
            `[date="${date}"]`,
        );
        if (!row)
            throw new Error(
                'Failed to get row in expense view to update M&IE total.',
            );
        row.updateMieAmount = newMieTotal;
        this.#mieSubtotal = totalMie;
        this.#lodgingSubtotal = totalLodging;
        this.#updateTotals();
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
        console.log(expenses);
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
