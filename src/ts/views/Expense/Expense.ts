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
import { USD, handlePointerDown, handlePointerUp } from '../../utils/misc';
import { applyStyles, removeStyles } from '../../utils/styles';

// HTML/CSS
import templateHTML from './template.html?raw';

// Custom Elements
import { PdcExpenseRow } from '../../components';
import { isDateRawType } from '../../utils/dates';
customElements.define('pdc-expense-row', PdcExpenseRow);

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcExpenseView extends HTMLElement {
    #rowsContainer: HTMLDivElement | null;
    #styled: boolean;
    #observer: MutationObserver | null = null;
    #mieSubtotal = 0;
    #lodgingSubtotal = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#rowsContainer = null;
        this.#styled = false;
    }

    render(styled: boolean, config: ConfigSectionText) {
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for location View.`);
        if (this.shadowRoot !== null) this.shadowRoot.innerHTML = '';

        this.#styled = styled;
        if (!this.#styled) {
            template.innerHTML = removeStyles(templateHTML);
        } else {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        }
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        const heading =
            this.shadowRoot.querySelector<HTMLHeadingElement>('#heading');
        const body =
            this.shadowRoot.querySelector<HTMLParagraphElement>('#body');
        const bodyPrint =
            this.shadowRoot.querySelector<HTMLParagraphElement>('#body-print');
        this.#rowsContainer =
            this.shadowRoot.querySelector<HTMLDivElement>('#rows');

        if (!(heading && body && bodyPrint && this.#rowsContainer))
            throw new Error('Failed to render elements for location View.');

        if (config.heading) {
            heading.innerHTML = '';
            heading.insertAdjacentHTML('beforeend', config.heading);
        } else {
            heading.remove();
        }

        if (config.body) {
            body.innerHTML = '';
            body.insertAdjacentHTML('beforeend', config.body);
        } else {
            body.remove();
        }

        if (config.bodyPrint) {
            bodyPrint.innerHTML = '';
            bodyPrint.insertAdjacentHTML('beforeend', config.bodyPrint);
        } else {
            body.remove();
        }

        // Event listeners for the delete location, add location, and generate expenses buttons
        let pointerStartX = 0;
        let pointerStartY = 0;
        this.shadowRoot.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;

            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        this.shadowRoot.addEventListener('pointerup', e => {
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
    }

    #handleClicks(e: Event) {
        const target = e.target;
        if (!(target instanceof Element || target instanceof SVGElement))
            return;
        const btn = target.closest('button');
        if (!btn) return;
        switch (true) {
            case btn.getAttribute('id') === 'toggle-expand':
                if (this.#styled) this.#expandAllRows(btn);
                break;
            case btn.getAttribute('id') === 'print-expenses':
                window.print();
                break;
            default:
                break;
        }
    }

    #expandAllRows(btn: HTMLButtonElement) {
        btn.classList.toggle('active');
        const rows =
            this.shadowRoot?.querySelectorAll<PdcExpenseRow>('pdc-expense-row');
        rows?.forEach(row => row.expand(btn.classList.contains('active')));
    }

    renderLoadingSpinner(enabled: boolean) {
        if (!this.#styled) return;
        const container = this.shadowRoot?.querySelector(
            '[data-pdc="expense-container"]',
        );
        if (!container)
            throw new Error(
                `Failed to get container element for Expense view.`,
            );
        enabled ?
            container.classList.remove('active')
        :   container.classList.add('active');
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

        if (!this.#rowsContainer)
            throw new Error('Failed to render row container for expense View.');
        this.#rowsContainer.innerHTML = '';
        const rows: PdcExpenseRow[] = [];
        const rates = new Set<string>();
        const sources = new Set<string>();
        expenses.forEach((expense, i, arr) => {
            const row = new PdcExpenseRow(
                expense,
                this.#styled,
                expensesCategory,
            );
            this.#rowsContainer?.appendChild(row);
            this.#mieSubtotal += expense.mieAmount;
            this.#lodgingSubtotal += expense.lodgingAmount;
            rows.push(row);

            sources.add(expense.source);

            const { country, city } = expense;
            const { effDate: date } = expense.rates;
            const monthYear = `${date.slice(5, 7)}/${date.slice(0, 4)}`;
            const createRateTableData = (expense: StateExpenseItemValid) => {
                const { effDate: _, ...rates } = expense.rates;
                return {
                    monthYear,
                    city,
                    country,
                    rates,
                };
            };

            if (
                i === 0 ||
                JSON.stringify(expense.rates) !==
                    JSON.stringify(arr[i - 1].rates)
            ) {
                rates.add(JSON.stringify(createRateTableData(expense)));
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
                    `<a href="${source}">${source}</a>`,
                );
            });

        const ratesEl = this.shadowRoot?.querySelector('#rates');

        console.log(rates.forEach(item => JSON.parse(item)));

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
                    <td class="border-r-2">${city}<br>${country}</td>
                    <td>${maxLodging.toFixed(2)}</td>
                    <td>${maxMie.toFixed(2)}</td>
                    <td>${maxMieFirstLast.toFixed(2)}</td>
                    <td class="border-r-2">${maxIncidental.toFixed(2)}</td>
                    <td>${deductionBreakfast.toFixed(2)}</td>
                    <td>${deductionLunch.toFixed(2)}</td>
                    <td>${deductionDinner.toFixed(2)}</td>
                </tr>
            `;
            ratesEl?.insertAdjacentHTML('beforeend', markup);
        });

        this.#updateTotals();
    }

    #updateTotals() {
        const mieSubtotalEl = this.shadowRoot?.querySelector('#mie-subtotal');
        const lodgingSubtotalEl =
            this.shadowRoot?.querySelector('#lodging-subtotal');
        const totalEl = this.shadowRoot?.querySelector('#total');

        if (!(mieSubtotalEl && lodgingSubtotalEl && totalEl))
            throw new Error(
                'Failed to generate subtotal and total elements in Expense view',
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

    handlerRowUpdate(controllerHandler: Function) {
        this.#observer?.disconnect();
        const target = this.shadowRoot;
        if (!target)
            throw new Error('Failed to render shadowRoot in Expense view.');
        const observerOptions = {
            subtree: true,
            attributes: true,
            attributeFilter: [
                'lodging',
                'breakfastprovided',
                'lunchprovided',
                'dinnerprovided',
            ],
        };
        const callback = (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                const target = mutation.target;
                if (!(target instanceof Element)) return;
                const result = this.#expenseRowUpdateResult(target);
                controllerHandler(result);
            });
        };
        if (this.#observer === null)
            this.#observer = new MutationObserver(callback);
        this.#observer.observe(target, observerOptions);
    }

    #expenseRowUpdateResult(target: Element): StateExpenseItemUpdate {
        const row = target.closest<Element>('pdc-expense-row');
        if (!row || !row.parentNode)
            throw new Error(`Failed to render rows in expense View.`);

        const date = row.getAttribute('date');
        const lodging = row.getAttribute('lodging');

        if (!(date && isDateRawType(date) && lodging))
            throw new Error(
                'Failed to get date and lodging values to update row in expense View.',
            );
        const breakfastProvided =
            row.getAttribute('breakfastprovided') === 'yes';
        const lunchProvided = row.getAttribute('lunchprovided') === 'yes';
        const dinnerProvided = row.getAttribute('dinnerprovided') === 'yes';

        return {
            date,
            lodgingAmount: +lodging,
            breakfastProvided,
            lunchProvided,
            dinnerProvided,
        };
    }
}

customElements.define('pdc-expense-view', PdcExpenseView);
