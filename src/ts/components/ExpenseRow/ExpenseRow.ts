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

// HTML/CSS
import templateHTML from './template.html?raw';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcExpenseRow extends HTMLElement {
    #expense: StateExpenseItemValid;
    #styled: boolean;
    #expensesCategory;
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
        this.#expensesCategory = expensesCategory;
        this.#styled = styled;

        const { deductions, rates, lodgingAmount, mieAmount } = this.#expense;
        this.#maxLodging = rates.maxLodging;
        this.#maxMie =
            deductions.FirstLastDay ? rates.maxMieFirstLast : rates.maxMie;
        this.#lodgingAmount = lodgingAmount;
        this.#mieAmount = mieAmount;

        this.render(styled);
    }

    render(styled: boolean) {
        // Clear shadowroot, determine if template should be styled, append template to shadowroot
        if (!this.shadowRoot)
            throw new Error(
                'Failed to create ShadowRoot for Meal custom element',
            );
        this.shadowRoot.innerHTML = '';
        if (styled) {
            template.innerHTML = templateHTML;
            this.shadowRoot && applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.shadowRoot?.appendChild(template.content.cloneNode(true));

        // Pull values from expense object
        const { city, country } = this.#expense;

        // Get elements for each value
        const {
            row,
            monthEl,
            dayEl,
            yearEl,
            locationEl,
            lodgingEl,
            lodgingRateEl,
            mieEl,
            mieRateEl,
            deductionsEl,
            totalEl,
        } = this.#getRowEls();

        const lodgingSummary =
            this.shadowRoot?.querySelector<HTMLInputElement>(
                '#summary-lodging',
            );

        const mieSummary =
            this.shadowRoot?.querySelector<HTMLInputElement>('#summary-mie');

        const totalSummary =
            this.shadowRoot?.querySelector<HTMLInputElement>('#summary-total');

        if (
            !(
                locationEl &&
                lodgingEl &&
                lodgingRateEl &&
                mieEl &&
                deductionsEl &&
                mieRateEl &&
                totalEl &&
                lodgingSummary &&
                mieSummary &&
                totalSummary
            )
        )
            throw new Error(
                `Failed to generate expense row elements for ${this.#expense.date} - ${this.#expense.city}.`,
            );

        // Update elements w/ values
        const date = new Date(this.#expense.date);
        monthEl.textContent = date.toUTCString().slice(7, 11);
        dayEl.textContent = date.getUTCDate().toString().padStart(2, '0');
        yearEl.textContent = date.getUTCFullYear().toString();
        locationEl.textContent = `${city} (${country})`;
        lodgingRateEl.setAttribute(
            'text',
            `<p class="font-semibold">Lodging</p>
            <p class="text-sm">Max ${USD.format(this.#maxLodging)}</p>`,
        );
        mieRateEl.setAttribute(
            'text',
            `<p class="font-semibold">M&IE</p>
            <p class="text-sm">Max ${USD.format(this.#maxMie)}</p>`,
        );

        // Update row's values
        this.setAttribute('date', this.#expense.date);
        this.#updateLodgingAmount(this.#lodgingAmount.toString());
        this.updateMieAmount(this.#mieAmount);

        // Delete elements if expenses category is not 'Both'
        if (this.#expensesCategory === 'mie') {
            lodgingEl.classList.add('disabled');
            this.shadowRoot
                ?.querySelector<HTMLInputElement>('#lodging-amount')
                ?.setAttribute('disabled', '');
        }
        if (this.#expensesCategory === 'lodging') {
            mieEl.classList.add('disabled');
            deductionsEl.classList.add('disabled');
            deductionsEl
                .querySelectorAll('input')
                .forEach(el => el.setAttribute('disabled', ''));
        }

        this.#updateTotalAmount();

        // Event listeners for inputs
        row.addEventListener('change', e => {
            this.#handleInputs(e);
        });

        // Event listener for clicks
        let pointerStartX = 0;
        let pointerStartY = 0;

        row.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });

        row.addEventListener('pointerup', e => {
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
        row.addEventListener('keydown', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });
    }

    #getRowEls = () => {
        if (!this.shadowRoot)
            throw new Error(
                'Failed to create ShadowRoot for Meal custom element',
            );
        const row = this.shadowRoot.querySelector<HTMLElement>('#expense-row');
        const rowSummary = this.shadowRoot.querySelector<HTMLElement>(
            '#expense-row-summary',
        );
        const monthEl = this.shadowRoot.querySelector('#month');
        const dayEl = this.shadowRoot.querySelector('#day');
        const yearEl = this.shadowRoot.querySelector('#year');
        const locationEl = this.shadowRoot.querySelector('#location');
        const lodgingEl = this.shadowRoot.querySelector('#lodging');
        const lodgingRateEl = this.shadowRoot.querySelector('#lodging-rate');
        const mieEl = this.shadowRoot.querySelector('#mie');
        const mieRateEl = this.shadowRoot.querySelector('#mie-rate');
        const deductionsEl = this.shadowRoot.querySelector('#deductions');
        const totalEl = this.shadowRoot.querySelector('#total');

        if (!(row && monthEl && dayEl && yearEl))
            throw new Error('Failed to render row elements.');

        return {
            row,
            rowSummary,
            monthEl,
            dayEl,
            yearEl,
            locationEl,
            lodgingEl,
            lodgingRateEl,
            mieEl,
            mieRateEl,
            deductionsEl,
            totalEl,
        };
    };

    rowToggle = async (toggle: 'open' | 'close' | null = null) => {
        const { row } = this.#getRowEls();
        if (!this.#styled || row.classList.contains('toggling')) return;

        // If no specific toggle set, fire either open or close based on current row height
        if (!toggle) {
            this.rowToggle(row.offsetHeight === 96 ? 'open' : 'close');
            return;
        }

        // Update classes/styles
        row.classList.remove('pdc-row-open', 'pdc-row-close');
        row.classList.add('toggling', `pdc-row-${toggle}`);

        // Fire toggles
        if (toggle === 'open') await this.#rowToggleOpen(row);
        if (toggle === 'close') await this.#rowToggleClose(row);

        row.classList.remove('toggling');
    };

    #rowToggleOpen = async (row: HTMLElement) => {
        // MAGIC 700
        await wait(700);
        // this.#enableRowTabIndex(row, true);
        row.style.height = row.scrollHeight + 'px';
        const { rowDetailsAnimateEl, rowSummaryAnimateEl } =
            this.#getRowAnimatedEls(row);
        rowSummaryAnimateEl.style.opacity = '0';
        rowDetailsAnimateEl.style.opacity = '100';
        rowDetailsAnimateEl.style.transform = `translateX(100%)`;
        rowSummaryAnimateEl.style.transform = `translateY(-200%)`;
    };

    #rowToggleClose = async (row: HTMLElement) => {
        // MAGIC 750
        await wait(750);
        // this.#enableRowTabIndex(row, false);
        row.style.height = row.clientHeight + 'px';
        const { rowDetailsAnimateEl, rowSummaryAnimateEl } =
            this.#getRowAnimatedEls(row);
        rowSummaryAnimateEl.style.opacity = '100';
        rowDetailsAnimateEl.style.opacity = '0';
        rowDetailsAnimateEl.style.transform = `translateX(0%)`;
        rowSummaryAnimateEl.style.transform = `translateY(0%)`;
    };

    #getRowAnimatedEls(row: Element) {
        const rowSummaryAnimateEl = row.querySelector<HTMLElement>(
            '[data-pdc="expense-row-summary"]',
        );
        const rowDetailsAnimateEl = row.querySelector<HTMLElement>(
            '[data-pdc="expense-row-details"]',
        );
        if (!(rowSummaryAnimateEl && rowDetailsAnimateEl))
            throw new Error('Failed to render row summary elements.');
        return {
            rowSummaryAnimateEl,
            rowDetailsAnimateEl,
        };
    }

    windowResize = () => {
        const { row } = this.#getRowEls();
        if (row.offsetHeight === 96) return;
        row.style.height =
            this.#getRowAnimatedEls(row).rowDetailsAnimateEl.scrollHeight +
            'px';
    };

    #handleInputs(e: Event) {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        target.getAttribute('id') === 'lodging-amount' &&
            this.#updateLodgingAmount(target.value);
        target.getAttribute('name') === 'breakfast' &&
            this.setAttribute(
                'breakfastprovided',
                target.checked ? 'yes' : 'no',
            );
        target.getAttribute('name') === 'lunch' &&
            this.setAttribute('lunchprovided', target.checked ? 'yes' : 'no');
        target.getAttribute('name') === 'dinner' &&
            this.setAttribute('dinnerprovided', target.checked ? 'yes' : 'no');
    }

    #handleClicks(e: Event) {
        const target = e.target;
        // Ignore (1) clicks on input elements and (2) clicks on non-SVG/HTML elements
        if (!(target instanceof SVGElement || target instanceof HTMLElement))
            return;

        // Only fire if it's an element within expense-row-summary
        if (!!target.closest('[data-pdc="expense-row-toggle"]'))
            this.rowToggle();
    }

    updateMieAmount(amount: number) {
        const mieTotalAmountInp =
            this.shadowRoot?.querySelector<HTMLInputElement>(
                '#mie-total-amount',
            );
        const mieSummary = this.shadowRoot?.querySelector<HTMLInputElement>(
            '#summary-mie-amount',
        );
        if (!(mieTotalAmountInp && mieSummary)) return; // Not throwing error b/c of lodging-only option
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
            this.shadowRoot?.querySelector<HTMLInputElement>('#lodging-amount');
        const lodgingSummary = this.shadowRoot?.querySelector<HTMLInputElement>(
            '#summary-lodging-amount',
        );
        if (!(lodgingInput && lodgingSummary))
            throw new Error(
                'Failed to render input element for lodging in Expense row.',
            );

        // Check if input was a valid amount. If yes, adopt it for the row. If no, reset the row's lodging amount to match the max lodging rate.

        const valid =
            !isNaN(parseFloat(value)) &&
            +value >= 0 &&
            +value <= this.#maxLodging;

        valid ?
            this.setAttribute('lodging', value)
        :   this.setAttribute('lodging', this.#maxLodging.toString());
        lodgingInput.value =
            valid ?
                (+value).toFixed(2).toString()
            :   this.#maxLodging.toFixed(2).toString();
        this.#lodgingAmount = valid ? +value : this.#maxLodging;
        lodgingSummary.textContent =
            valid ? USD.format(+value) : USD.format(this.#maxLodging);
        if (this.#styled) highlightSuccess(lodgingInput);
        this.#updateTotalAmount();
    }

    #updateTotalAmount() {
        const totalAmount = this.#lodgingAmount + this.#mieAmount;
        const totalEls = this.shadowRoot?.querySelectorAll(
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

    getSource() {
        return this.#expense.source;
    }

    getRateTableDate() {
        const { effDate: _, ...rates } = this.#expense.rates;
        const { date, country, city } = this.#expense;
        return { date, country, city, rates };
    }

    getAmounts() {
        const { mieAmount, lodgingAmount } = this.#expense;
        return { mieAmount, lodgingAmount };
    }

    #getRowIndex() {
        if (!this.parentNode)
            throw new Error(`Failed to get row index in Expense view.`);
        return Array.from(
            this.parentNode.querySelectorAll('pdc-expense-row'),
        ).indexOf(this);
    }

    setRowBgColor = () => {
        const { row } = this.#getRowEls();
        const index = this.#getRowIndex();
        const color = index % 2 === 0 ? 'neutral-50' : 'white';
        const oppColor = color === 'neutral-50' ? 'white' : 'neutral-50';
        row.classList.remove('bg-neutral-50', 'bg-white');
        row.classList.add(`bg-${color}`);
        [...this.#getRowAnimatedEls(row).rowDetailsAnimateEl.children].forEach(
            (el, i) => {
                el.classList.remove('bg-white', 'bg-neutral-50');
                el.classList.add(
                    i % 2 === 0 ? `bg-${color}` : `bg-${oppColor}`,
                );
            },
        );
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.style.zIndex = index.toString();
    };
}
