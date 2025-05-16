// Types
import type { DateRaw } from '../../types/dates';

// Utils
import {
    applyStyles,
    removeStyles,
    highlightSuccess,
    highlightError,
} from '../../utils/styles';
import {
    isDateRawType,
    offsetDateString,
    INPUT_DATE_MIN,
    INPUT_DATE_MAX,
    YEAR_MIN_REGEX,
    YEAR_MAX_REGEX,
    YEAR_INCOMPLETE_REGEX,
} from '../../utils/dates';

// HTML/CSS
import templateHTML from './template.html?raw';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcLocationDate extends HTMLElement {
    #attrName: 'start' | 'end';
    #valid = false;
    #input: HTMLInputElement;
    #error: Element;
    #styled = false;
    #startEl: PdcLocationDate;
    #endEl: PdcLocationDate;
    #enabled = false;

    constructor() {
        super();
        this.#attrName = this.getAttribute('pdc') === 'start' ? 'start' : 'end';
        this.attachShadow({ mode: 'open' });
        if (!this.shadowRoot)
            throw new Error(
                `Failed to create shadowRoot for start date in Location view.`,
            );

        this.#styled = this.getAttribute('styled') === 'true';

        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        const { input, label, error, startEl, endEl } = this.#getEls();

        this.#input = input;
        this.#error = error;
        this.#startEl = startEl;
        this.#endEl = endEl;

        label.textContent =
            this.#attrName.charAt(0).toUpperCase() + this.#attrName.slice(1);

        this.#attrName === 'start' ?
            this.restrictStartInput()
        :   this.restrictEndInput();

        this.enableTabIndex(false);

        // Apply listeners for inputs only after initial restrictInput(), and potentially any changes to input/attr by it, are done
        this.#input.addEventListener('change', e => {
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (YEAR_INCOMPLETE_REGEX.test(target.value)) return;
            this.#handleChange(target);
        });
    }

    enableTabIndex(enable: boolean) {
        enable ?
            this.#input.setAttribute('tabindex', '0')
        :   this.#input.setAttribute('tabindex', '-1');
    }

    #getEls = () => {
        const row = this.closest<HTMLUListElement>('[data-pdc="location-row"]');
        const input = this.shadowRoot?.querySelector('input');
        const label = this.shadowRoot?.querySelector('label');
        const error = this.shadowRoot?.querySelector('#error');
        const startEl = row?.querySelector<PdcLocationDate>(
            'pdc-location-date[pdc="start"]',
        );
        const endEl = row?.querySelector<PdcLocationDate>(
            'pdc-location-date[pdc="end"]',
        );

        if (!(row && input && label && error && startEl && endEl))
            throw new Error(
                `Failed to render ${this.#attrName} date elements in Location view.`,
            );

        return {
            row,
            input,
            label,
            error,
            startEl,
            endEl,
        };
    };

    #handleChange(target: HTMLInputElement) {
        this.updateInput(target.value);
    }

    #reset() {
        this.setInputValue();
        this.setAttr();
        this.focusEl();
    }

    #resetEnd() {
        this.#endEl.setInputValue();
        this.#endEl.setAttr();
        this.#endEl.restrictEndInput();
    }

    async updateInput(date: string | null = null) {
        // If no input value, reset element's values and return
        if (!date) {
            this.#reset();
            if (this.#attrName === 'start') this.#resetEnd();
            return;
        }

        if (YEAR_MIN_REGEX.test(date)) {
            if (this.#styled) this.renderError(true, `Date must be after 2020`);
            this.#reset();
            if (this.#attrName === 'start') this.#resetEnd();
            return;
        }

        if (YEAR_MAX_REGEX.test(date)) {
            if (this.#styled)
                this.renderError(true, `Date must be before 2041`);
            this.#reset();
            if (this.#attrName === 'start') this.#resetEnd();
            return;
        }

        if (YEAR_INCOMPLETE_REGEX.test(date)) {
            if (this.#styled) this.renderError(true, `Enter a valid date.`);
            this.#reset();
            if (this.#attrName === 'start') this.#resetEnd();
            return;
        }

        const startDate = this.#startEl.inputValue;
        const endDate = this.#endEl.inputValue;

        // If start is older than end, reset end and show error
        if (
            startDate &&
            endDate &&
            isDateRawType(startDate) &&
            Date.parse(startDate) > Date.parse(endDate)
        ) {
            this.#startEl.setInputValue(startDate);
            this.#startEl.setAttr(startDate);
            await this.#startEl.restrictStartInput();
            this.#endEl.updateInput();
            this.#endEl.restrictEndInput();
            this.#endEl.focusEl();
            if (this.#styled)
                this.#endEl.renderError(
                    true,
                    'End date must be after start date.',
                );
            return;
        }

        if (this.#input.value !== date && isDateRawType(date))
            this.setInputValue(date);
        if (this.getAttribute(this.#attrName) !== date && isDateRawType(date))
            this.setAttr(date);
        await this.#startEl.restrictStartInput();
        this.#endEl.restrictEndInput();
        if (this.#styled) highlightSuccess(this.#input);
        if (this.#styled) this.renderError(false);
    }

    async restrictStartInput() {
        // Get elements for current row end date and previouss row end date
        const endDate = this.#endEl.pdcValue;
        const prevRow = this.closest(
            '[data-pdc="location-row"]',
        )?.previousElementSibling;
        const prevRowEndEl =
            prevRow?.querySelector<PdcLocationDate>('[pdc="end"]');
        const prevRowEndDate = prevRowEndEl?.pdcValue;

        // If no current row end date and no previous row, input should be enabled, no min, no max, and no further action
        if (!endDate && !prevRow) {
            this.enable(true);
            this.#setMax();
            this.#setMin();
            return;
        }

        // If no previous row, input should be enabled
        if (!prevRow) {
            this.enable(true);
        }

        // If valid current row end date, set input max to current row end date
        if (endDate && isDateRawType(endDate)) {
            this.#setMax(endDate);
        }

        // If previous row, disable input
        if (prevRowEndDate && isDateRawType(prevRowEndDate)) {
            this.enable(false);
            const correctStart = offsetDateString(prevRowEndDate, 1);
            this.#setMin(correctStart); // Min set to prev end date + 1 day
            if (this.pdcValue !== correctStart) this.updateInput(correctStart); // Update input value and element attr if they don't match current start
            prevRowEndEl?.enable(false); // Disable previous end date
        }
    }

    restrictEndInput() {
        // Get elements for current row start date and next row start date
        const startDate = this.#startEl.pdcValue;
        const nextRow = this.closest(
            '[data-pdc="location-row"]',
        )?.nextElementSibling;
        const nextRowStartEl =
            nextRow?.querySelector<PdcLocationDate>('[pdc="start"]');
        const nextRowStartDate = nextRowStartEl?.pdcValue;

        // If no valid current row start date, input should be disabled, no min, no max, and no further action
        if (!startDate || !isDateRawType(startDate)) {
            this.enable(false);
            this.#setMin();
            this.#setMax();
            return;
        }

        // If valid current row start date and no next row, input should be enabled, min of current row start date
        if (startDate && isDateRawType(startDate)) {
            this.enable(true);
            this.#setMin(startDate);
        }

        // If next row, input should be disabled,
        if (nextRowStartDate && isDateRawType(nextRowStartDate)) {
            this.enable(false);
            const correctEnd = offsetDateString(nextRowStartDate, -1);
            this.#setMax(correctEnd); // Max set to next row start date - 1
            if (this.pdcValue !== correctEnd) this.updateInput(correctEnd); // Update input value and element attr if they don't match current end
            nextRowStartEl?.enable(false); // Disable next row start date
        }
    }

    enable(enable: boolean) {
        enable ?
            this.#input.removeAttribute('disabled')
        :   this.#input.setAttribute('disabled', 'true');
        this.enableTabIndex(enable);
        this.#enabled = enable;
    }
    // setMin and setMax handled with restrictInput()
    #setMin(value: DateRaw | null = null) {
        value ?
            this.#input.setAttribute('min', value)
        :   this.#input.setAttribute('min', INPUT_DATE_MIN);
    }
    #setMax(value: DateRaw | null = null) {
        value ?
            this.#input.setAttribute('max', value)
        :   this.#input.setAttribute('max', INPUT_DATE_MAX);
    }
    // setAttr and setInputValue handled with updateInput
    setAttr(value: DateRaw | null = null) {
        value ?
            this.setAttribute(this.#attrName, value)
        :   this.removeAttribute(this.#attrName);
    }

    focusEl() {
        this.#input.focus();
    }

    renderError(
        enable: boolean,
        msg: string = `Enter a valid ${this.#attrName} date.`,
    ) {
        if (enable) {
            highlightError(this.#input);
            this.focusEl();
            this.#error.textContent = msg;
            this.#error.classList.add('active');
            return;
        }
        this.#error.classList.remove('active');
        setTimeout(() => {
            this.#error.innerHTML = '&nbsp;';
        }, 300);
    }

    get inputValue() {
        return this.#input.value;
    }
    setInputValue(value: DateRaw | null = null) {
        value ? (this.#input.value = value) : (this.#input.value = '');
    }

    get isEnabled() {
        return this.#enabled;
    }

    get pdcValue() {
        const value = this.getAttribute(this.#attrName);
        return !!value && isDateRawType(value) ? value : null;
    }

    validate() {
        this.#valid = false;
        const attr = this.getAttribute(this.#attrName);
        if (!(attr && isDateRawType(attr))) {
            if (this.#styled) this.renderError(true);
            return this.#valid;
        }
        this.#valid = true;
        return this.#valid;
    }
}
