// Types
import type { StateExpenseItemValid } from '../../types/expenses';

// Utils
import {
    handlePointerDown,
    handlePointerUp,
    USD,
    wait,
} from '../../utils/misc';
import {
    applyStyles,
    removeStyles,
    highlightSuccess,
} from '../../utils/styles';
import { ROW_CLOSED_HEIGHT, ROW_ANIMATE_MS } from '../../utils/config';
import { getShortMonth, getDD, getYYYY, getMM } from '../../utils/dates';

// HTML/CSS
import templateHTML from './template.html?raw';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcExpenseRow extends HTMLElement {
    /* SETUP
     */
    #expense: StateExpenseItemValid;
    #expensesCategory;
    #styled: boolean;
    #maxLodging: number;
    #maxMie: number;
    #lodgingAmount: number;
    #mieAmount: number;

    constructor(
        expense: StateExpenseItemValid,
        styled: boolean,
        expensesCategory: 'mie' | 'lodging' | 'both',
    ) {
        super();
        this.attachShadow({ mode: 'open' });

        this.#expense = expense;
        this.#styled = styled;
        this.#expensesCategory = expensesCategory;

        const { deductions, rates, lodgingAmount, mieAmount } = this.#expense;
        this.#maxLodging = rates.maxLodging;
        this.#maxMie =
            deductions.FirstLastDay ? rates.maxMieFirstLast : rates.maxMie;
        this.#lodgingAmount = lodgingAmount;
        this.#mieAmount = mieAmount;

        this.render(styled);
    }

    render(styled: boolean) {
        this.#shadowRoot.innerHTML = '';
        if (styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.#shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.#shadowRoot.appendChild(template.content.cloneNode(true));

        // Update text elements w/ values
        this.#setRowDateText();
        this.#setRowDetailsText();

        // Update custom element's attribute values
        this.setAttribute('date', this.#expense.date);
        this.#updateLodgingAmount(this.#lodgingAmount.toString());
        this.updateMieAmount(this.#mieAmount);
        this.#updateTotalAmount();

        this.#disableUnusedRowEls();
        this.#addEventListeners();
    }

    #setRowDateText() {
        const monthEl = this.#shadowRoot.querySelector('#month');
        const dayEl = this.#shadowRoot.querySelector('#day');
        const yearEl = this.#shadowRoot.querySelector('#year');
        const date = new Date(this.#expense.date);
        if (!(monthEl && dayEl && yearEl))
            throw new Error(`Failed to render row's date elements.`);
        monthEl.textContent = getShortMonth(date.toUTCString());
        dayEl.textContent = getDD(this.#expense.date);
        yearEl.textContent = getYYYY(this.#expense.date);
    }

    #setRowDetailsText() {
        const locationEl = this.#shadowRoot.querySelector('#location');
        const lodgingRateEl = this.#shadowRoot.querySelector('#lodging-rate');
        const mieRateEl = this.#shadowRoot.querySelector('#mie-rate');
        if (!(locationEl && lodgingRateEl && mieRateEl))
            throw new Error(`Failed to render row's rate elements.`);

        locationEl.textContent = `${this.#expense.city} (${this.#expense.country})`;
        lodgingRateEl.setAttribute(
            'text',
            `<p class="font-semibold">Lodging</p>
            <p class="text-sm sm:text-base">Max ${USD.format(this.#maxLodging)}</p>`,
        );
        mieRateEl.setAttribute(
            'text',
            `<p class="font-semibold">M&IE</p>
            <p class="text-sm sm:text-base">Max ${USD.format(this.#maxMie)}</p>`,
        );
    }

    #disableUnusedRowEls() {
        const lodgingEl = this.#shadowRoot.querySelector('#lodging');
        const deductionsEl = this.#shadowRoot.querySelector('#deductions');
        if (this.#expensesCategory === 'mie') {
            lodgingEl?.classList.add('disabled');
            this.#shadowRoot
                .querySelector<HTMLInputElement>('#lodging-amount')
                ?.setAttribute('disabled', '');
        }
        if (this.#expensesCategory === 'lodging') {
            deductionsEl?.classList.add('disabled');
            deductionsEl
                ?.querySelectorAll('input')
                .forEach(el => el.setAttribute('disabled', ''));
        }
    }

    /* EVENTS
     */
    #addEventListeners() {
        // Input change events
        this.#row.addEventListener('change', e => {
            this.#handleInputs(e);
        });

        // Mouse, touch events
        let pointerStartX = 0;
        let pointerStartY = 0;
        this.#row.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        this.#row.addEventListener('pointerup', e => {
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
        this.#row.addEventListener('keydown', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });
    }

    #handleInputs(e: Event) {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (target.getAttribute('id') === 'lodging-amount') {
            this.#updateLodgingAmount(target.value);
            return;
        }
        const attrName = target.getAttribute('name');
        if (
            !(
                attrName === 'breakfast' ||
                attrName === 'lunch' ||
                attrName === 'dinner'
            )
        )
            return;

        this.setAttribute(`${attrName}provided`, target.checked ? 'yes' : 'no');
    }

    #handleClicks(e: Event) {
        const target = e.target;
        if (!(target instanceof SVGElement || target instanceof HTMLElement))
            return;
        if (target.closest('[data-pdc="expense-row-toggle"]')) this.rowToggle();
        if (
            !!target.closest('#deductions') &&
            e instanceof KeyboardEvent &&
            target instanceof HTMLLabelElement
        ) {
            target.click();
        }
    }

    /* GET ELS
     */
    get #row() {
        const el = this.#shadowRoot.querySelector<HTMLElement>('#expense-row');
        if (!el) throw new Error('Failed to render row elements.');
        return el;
    }

    get #rowAnimatedEls() {
        const summary = this.#row.querySelector<HTMLElement>(
            '[data-pdc="expense-row-summary"]',
        );
        const details = this.#row.querySelector<HTMLElement>(
            '[data-pdc="expense-row-details"]',
        );
        if (!(summary && details))
            throw new Error('Failed to render row summary elements.');
        return {
            summary,
            details,
        };
    }

    get #shadowRoot() {
        if (!this.shadowRoot)
            throw new Error(
                'Failed to create ShadowRoot for expense row custom element',
            );
        return this.shadowRoot;
    }

    /* VISUAL METHODS
     */
    rowToggle = async (toggle: 'open' | 'close' | null = null) => {
        if (!this.#styled || this.#row.classList.contains('toggling')) return;

        if (!toggle) {
            this.rowToggle(
                this.#row.offsetHeight === ROW_CLOSED_HEIGHT ? 'open' : 'close',
            );
            return;
        }

        this.#row.classList.remove('pdc-row-open', 'pdc-row-close');
        this.#row.classList.add('toggling', `pdc-row-${toggle}`);

        await this.#animateRow(toggle);
        this.#row.classList.remove('toggling');
    };

    #animateRow = async (direction: 'open' | 'close') => {
        await wait(ROW_ANIMATE_MS);
        this.#enableRowTabIndex(direction === 'open' ? true : false);
        this.#row.style.height = `${direction === 'open' ? this.#row.scrollHeight : this.#row.clientHeight}px`;
        this.#rowAnimatedEls.summary.style.opacity =
            direction === 'open' ? '0' : '100';
        this.#rowAnimatedEls.summary.style.transform =
            direction === 'open' ? `translateY(-200%)` : `translateY(0%)`;
        this.#rowAnimatedEls.details.style.opacity =
            direction === 'open' ? '100' : '0';
        this.#rowAnimatedEls.details.style.transform =
            direction === 'open' ? `translateX(100%)` : `translateX(0%)`;
    };

    windowResize = () => {
        if (this.#row.offsetHeight === ROW_CLOSED_HEIGHT) return;
        this.#row.style.height =
            this.#rowAnimatedEls.details.scrollHeight + 'px';
    };

    styleRow = () => {
        if (!this.parentNode)
            throw new Error(`Failed to get row index in Expense view.`);
        const index = Array.from(
            this.parentNode.querySelectorAll('pdc-expense-row'),
        ).indexOf(this);
        const color = index % 2 === 0 ? 'neutral-50' : 'white';
        const oppColor = color === 'neutral-50' ? 'white' : 'neutral-50';
        this.#row.classList.remove('bg-neutral-50', 'bg-white');
        this.#row.classList.add(`bg-${color}`);
        [...this.#rowAnimatedEls.details.children].forEach((el, i) => {
            el.classList.remove('bg-white', 'bg-neutral-50');
            el.classList.add(i % 2 === 0 ? `bg-${color}` : `bg-${oppColor}`);
        });
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.style.zIndex = index.toString();
    };

    /* UPDATE METHODS
     */

    #enableRowTabIndex(enable: boolean) {
        this.#shadowRoot
            .querySelector('[data-pdc="expense-row-details"]')
            ?.querySelectorAll('[tabindex]')
            .forEach(el => {
                el.setAttribute('tabindex', enable ? '0' : '-1');
            });
    }

    updateMieAmount(amount: number) {
        const mieTotalAmountInp =
            this.#shadowRoot.querySelector<HTMLInputElement>(
                '#mie-total-amount',
            );
        const mieSummary = this.#shadowRoot.querySelector<HTMLInputElement>(
            '#summary-mie-amount',
        );
        if (!(mieTotalAmountInp && mieSummary))
            throw new Error(`Failed to render row's M&IE elements.`);
        const oldAmount = mieTotalAmountInp.value;
        const newAmount = amount.toFixed(2).toString();
        if (oldAmount === newAmount) return;

        mieTotalAmountInp.value = newAmount;
        mieSummary.textContent = USD.format(amount);
        this.#mieAmount = amount;
        if (this.#styled) highlightSuccess(mieTotalAmountInp);
        this.#updateTotalAmount();
    }

    #updateLodgingAmount(value: string) {
        const lodgingInput =
            this.#shadowRoot.querySelector<HTMLInputElement>('#lodging-amount');
        const lodgingSummary = this.#shadowRoot.querySelector<HTMLInputElement>(
            '#summary-lodging-amount',
        );
        if (!(lodgingInput && lodgingSummary))
            throw new Error(
                'Failed to render input element for lodging in Expense row.',
            );

        // Check if input was a valid amount. If yes, adopt it for the row. If no, reset the row's lodging amount to match the max lodging rate.

        const isValidLodgingAmount = (value: string) => {
            return (
                !isNaN(parseFloat(value)) &&
                +value >= 0 &&
                +value <= this.#maxLodging
            );
        };

        if (isValidLodgingAmount(value)) {
            this.setAttribute('lodging', value);
            lodgingInput.value = (+value).toFixed(2).toString();
            this.#lodgingAmount = +value;
            lodgingSummary.textContent = USD.format(+value);
        } else {
            this.setAttribute('lodging', this.#maxLodging.toString());
            lodgingInput.value = this.#maxLodging.toFixed(2).toString();
            this.#lodgingAmount = this.#maxLodging;
            lodgingSummary.textContent = USD.format(this.#maxLodging);
        }

        if (this.#styled) highlightSuccess(lodgingInput);
        this.#updateTotalAmount();
    }

    #updateTotalAmount() {
        const totalAmount = this.#lodgingAmount + this.#mieAmount;
        const totalEls = this.#shadowRoot.querySelectorAll(
            '[data-pdc="expense-total"]',
        );
        totalEls?.forEach(el => {
            if (el instanceof HTMLInputElement) {
                el.value = totalAmount.toFixed(2).toString();
                if (this.#styled) highlightSuccess(el);
            }
            if (el instanceof HTMLParagraphElement)
                el.textContent = `${USD.format(totalAmount)}`;
        });
    }

    /* GET DATA METHODS
     */
    get rateSource() {
        return this.#expense.source;
    }

    get rateString() {
        const { effDate, ...rates } = this.#expense.rates;
        const { country, city } = this.#expense;
        return JSON.stringify({ city, country, rates });
    }

    get rateStringForTable() {
        const { date, country, city, rates } = this.#expense;
        const monthYear = `${getMM(date)}/${getYYYY(date)}`;
        return JSON.stringify({ monthYear, country, city, rates });
    }

    get amount() {
        const { mieAmount: mie, lodgingAmount: lodging } = this.#expense;
        return { mie, lodging };
    }
}
