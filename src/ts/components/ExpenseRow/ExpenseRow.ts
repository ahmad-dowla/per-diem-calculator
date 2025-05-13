// Types
import type { StateExpenseItemValid } from '../../types/expenses';

// Utils
import { handlePointerDown, handlePointerUp, USD } from '../../utils/misc';
import {
    applyStyles,
    removeStyles,
    highlightSuccess,
    highlightError,
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
        const { deductions, rates, lodgingAmount, mieAmount } = this.#expense;
        this.#expensesCategory = expensesCategory;
        this.#maxLodging = rates.maxLodging;
        this.#maxMie =
            deductions.FirstLastDay ? rates.maxMieFirstLast : rates.maxMie;
        this.#lodgingAmount = lodgingAmount;
        this.#mieAmount = mieAmount;

        this.#styled = styled;
        this.render(styled);
    }

    render(styled: boolean) {
        // Clear shadowroot, determine if template should be styled, append template to shadowroot
        if (!this.shadowRoot)
            throw new Error(
                'Failed to create ShadowRoot for Meal custom element',
            );
        this.shadowRoot.innerHTML = '';
        if (!styled) {
            template.innerHTML = removeStyles(templateHTML);
        } else {
            template.innerHTML = templateHTML;
            this.shadowRoot && applyStyles(this.shadowRoot);
        }
        this.shadowRoot?.appendChild(template.content.cloneNode(true));

        // Pull values from expense object
        const { date, city, country } = this.#expense;

        // Get elements for each value
        const dateEl = this.shadowRoot.querySelector('#date');
        const locationEl = this.shadowRoot.querySelector('#location');
        const lodgingEl = this.shadowRoot.querySelector('#lodging');
        const lodgingRateEl = this.shadowRoot.querySelector('#lodging-rate');
        const mieEl = this.shadowRoot.querySelector('#mie');
        const mieRateEl = this.shadowRoot.querySelector('#mie-rate');
        const deductionsEl = this.shadowRoot.querySelector('#deductions');
        const totalEl = this.shadowRoot.querySelector('#total');

        if (
            !(
                dateEl &&
                locationEl &&
                lodgingEl &&
                lodgingRateEl &&
                mieEl &&
                deductionsEl &&
                mieRateEl &&
                totalEl
            )
        )
            throw new Error(
                `Failed to generate expense row elements for ${this.#expense.date} - ${this.#expense.city}.`,
            );

        // Update elements w/ values
        dateEl.textContent = `${date.slice(5).replaceAll('-', '/')}/${date.slice(2, 4)}`;
        locationEl.textContent = `${city} (${country})`;
        lodgingRateEl.textContent = `Max: ${USD.format(this.#maxLodging)}`;
        mieRateEl.textContent = `Max: ${USD.format(this.#maxMie)}`;

        // Update row's values
        this.setAttribute('date', date);
        this.#updateLodgingAmount(this.#lodgingAmount.toString());
        this.updateMieAmount = this.#mieAmount;

        // Delete elements if expenses category is not 'Both'
        if (this.#expensesCategory === 'mie') {
            lodgingEl.remove();
            totalEl.remove();
        }
        if (this.#expensesCategory === 'lodging') {
            mieEl.remove();
            deductionsEl.remove();
            totalEl.remove();
        }

        this.#updateTotalAmount();

        // Event listeners for inputs
        this.shadowRoot.addEventListener('change', e => {
            this.#handleInputs(e);
        });

        // Event listener for clicks
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

        const row = target.closest('[data-pdc="expense-row"]');
        // Only fire if it's an element within expense-row-summary
        !!target.closest('[data-pdc="expense-row-summary"]') &&
            row &&
            row.classList.toggle('pdc-row-open');
    }

    expand(run: boolean) {
        const row = this.shadowRoot?.querySelector('[data-pdc="expense-row"]');
        run ?
            row && row.classList.add('pdc-row-open')
        :   row && row.classList.remove('pdc-row-open');
    }

    updateFirstLastDay(name: 'first' | 'last') {
        if (this.#expensesCategory === 'lodging') return;
        const input = this.shadowRoot?.querySelector<HTMLInputElement>(
            `#${name}Day`,
        );
        if (!input)
            throw new Error(
                'Failed to get First/Last Day input element in Expense Row view.',
            );
        input.checked = true;
    }

    #updateLodgingAmount(value: string) {
        const lodgingInput =
            this.shadowRoot?.querySelector<HTMLInputElement>('#lodging-amount');
        if (!lodgingInput)
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
        if (this.#styled) highlightSuccess(lodgingInput);
        this.#updateTotalAmount();
    }

    set updateMieAmount(amount: number) {
        const mieTotalAmountInp =
            this.shadowRoot?.querySelector<HTMLInputElement>(
                '#mie-total-amount',
            );
        if (!mieTotalAmountInp) return; // Not throwing error b/c of lodging-only option
        const oldAmount = mieTotalAmountInp.value;
        const newAmount = amount.toFixed(2).toString();
        if (oldAmount === newAmount) return;

        mieTotalAmountInp.value = newAmount;
        this.#mieAmount = amount;
        if (this.#styled) highlightSuccess(mieTotalAmountInp);
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
            if (el instanceof HTMLHeadingElement)
                el.textContent = `${USD.format(totalAmount)}`;
        });
    }
}
