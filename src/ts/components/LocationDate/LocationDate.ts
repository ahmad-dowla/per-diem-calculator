// Types
import type { DateRaw } from '../../types/dates';

// Utils
import { applyStyles, removeStyles } from '../../utils/styles';
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
    /* SETUP
     */
    static observedAttributes = ['bg'];
    #attrName: 'start' | 'end';
    #valid = false;
    #styled = false;
    #enabled = false;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#attrName = this.getAttribute('pdc') === 'start' ? 'start' : 'end';
        this.#styled = this.getAttribute('styled') === 'true';

        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.#shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.#shadowRoot.appendChild(template.content.cloneNode(true));

        this.#label.setAttribute(
            'text',
            this.#attrName.charAt(0).toUpperCase() + this.#attrName.slice(1),
        );
        this.#label.setAttribute(
            'title',
            `${this.#attrName.charAt(0).toUpperCase()}${this.#attrName.slice(1)} Date`,
        );
        if (this.#attrName === 'start') this.restrictStartInput();
        else this.restrictEndInput();

        this.enableTabIndex(false);
        this.#styleEl();
        this.#addEventListeners();
    }

    /* EVENTS
     */
    attributeChangedCallback(
        _name: string,
        _oldValue: string,
        newValue: string,
    ) {
        if (!this.#styled) return;
        this.#styleEl(`bg-${newValue === 'white' ? 'white' : 'neutral-50'}`);
    }

    #addEventListeners() {
        this.#input.addEventListener('change', e => {
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (YEAR_INCOMPLETE_REGEX.test(target.value)) return;
            this.handleInputChange(target.value);
        });
    }

    /* GET ELS
     */
    get #label() {
        const el = this.#shadowRoot.querySelector('pdc-label');
        if (!el)
            throw new Error(`Failed to render label in Date custom element`);
        return el;
    }

    get #input() {
        const el = this.#shadowRoot.querySelector('input');
        if (!el)
            throw new Error(`Failed to render input in Date custom element`);
        return el;
    }

    get #container() {
        const el = this.#shadowRoot.querySelector('#pdc-container');
        if (!el)
            throw new Error(
                `Failed to render container for Date custom element`,
            );
        return el;
    }

    get #shadowRoot() {
        if (!this.shadowRoot)
            throw new Error(
                `Failed to render shadowRoot in Category custom element`,
            );
        return this.shadowRoot;
    }

    get #row() {
        const el = this.closest<HTMLElement>('[data-pdc="location-row"]');
        if (!el) throw new Error(`Failed to get row from Date custom element`);
        return el;
    }

    get #prevRow() {
        const el = this.#row.previousElementSibling;
        const startDate =
            el?.querySelector<PdcLocationDate>('[pdc="start"]')?.pdcValue;
        const endEl = el?.querySelector<PdcLocationDate>('[pdc="end"]');
        const endDate = endEl?.pdcValue;
        return { el, startDate, endEl, endDate };
    }

    get #nextRow() {
        const el = this.#row.nextElementSibling;
        const startEl = el?.querySelector<PdcLocationDate>('[pdc="start"]');
        const startDate = startEl?.pdcValue;
        const endDate =
            el?.querySelector<PdcLocationDate>('[pdc="end"]')?.pdcValue;
        return { el, startEl, startDate, endDate };
    }

    get #startEl() {
        const el = this.#row.querySelector<PdcLocationDate>('[pdc="start"]');
        if (!el)
            throw new Error(
                `Failed to get row startDateEl from Date custom element`,
            );
        return el;
    }

    get #endEl() {
        const el = this.#row.querySelector<PdcLocationDate>('[pdc="end"]');
        if (!el)
            throw new Error(
                `Failed to get row endDateEl from Date custom element`,
            );
        return el;
    }

    get #errorEl() {
        const el = this.closest('#locations-container')?.querySelector(
            '#error',
        );
        if (!el)
            throw new Error(
                `Failed to get View's error element from Category custom element`,
            );
        return el;
    }

    /* VISUAL METHODS
     */
    #styleEl(bgColor: 'bg-white' | 'bg-neutral-50' | null = null) {
        if (!this.#styled) return;
        const div = this.#shadowRoot.querySelector('div');
        div?.classList.remove(`bg-white`, `bg-neutral-50`);
        div?.classList.add(bgColor ? bgColor : `bg-${this.getAttribute('bg')}`);
    }

    focusEl() {
        this.#input.focus();
    }

    /* UPDATE METHODS
     */
    enableTabIndex(enable: boolean) {
        this.#input.setAttribute('tabindex', enable ? '0' : '-1');
    }

    enable(enable: boolean) {
        if (enable) {
            this.#input.removeAttribute('disabled');
            this.#container.removeAttribute('inert');
        } else {
            this.#input.setAttribute('disabled', 'true');
            this.#container.setAttribute('inert', '');
            this.#input.classList.remove('success');
        }
        this.enableTabIndex(enable);
        this.#enabled = enable;
    }

    #setMin(value: DateRaw | null = null) {
        this.#input.setAttribute('min', value ? value : INPUT_DATE_MIN);
    }

    #setMax(value: DateRaw | null = null) {
        this.#input.setAttribute('max', value ? value : INPUT_DATE_MAX);
    }

    #setAttr(value: DateRaw | null = null) {
        if (value) this.setAttribute(this.#attrName, value);
        else this.removeAttribute(this.#attrName);
    }

    #setInputValue(value: DateRaw | null = null) {
        this.#input.value = value ? value : '';
    }

    #reset() {
        this.#setInputValue();
        this.#setAttr();
        this.focusEl();
    }

    #resetEnd() {
        this.#endEl.#setInputValue();
        this.#endEl.#setAttr();
        this.#endEl.restrictEndInput();
    }

    async handleInputChange(date: string | null = null) {
        if (this.#styled) this.#input.classList.remove('success');
        if (!this.#isValidInput(date) || !date) return;
        if (!(await this.#isStartBeforeEnd()) || !isDateRawType(date)) return;
        this.#setInputValue(date);
        this.#setAttr(date);
        await this.#startEl.restrictStartInput();
        this.#endEl.restrictEndInput();
        if (this.#styled) {
            this.#input.classList.remove('error');
            this.#input.classList.add('success');
            this.renderError(false);
        }
    }

    #updateStartBasedOnPrevEnd() {
        if (!this.#prevRow.endDate) return;
        const correctStart = offsetDateString(this.#prevRow.endDate, 1);
        if (this.#startDateInputVal === correctStart) return;
        this.enable(false);
        this.#setMin(correctStart);
        this.#setInputValue(correctStart);
        this.#setAttr(correctStart);
        this.#input.classList.add('success');
        this.#prevRow.endEl?.enable(false);
    }

    #updateEndBasedOnNextStart() {
        if (!this.#nextRow.startDate) return;
        this.enable(false);
        const correctEnd = offsetDateString(this.#nextRow.startDate, -1);
        if (this.#endDateInputVal === correctEnd) return;
        this.#setMax(correctEnd);
        this.#setInputValue(correctEnd);
        this.#setAttr(correctEnd);
        this.#input.classList.add('success');
        this.#nextRow.startEl?.enable(false);
    }

    /* VALIDATION
     */
    renderError(
        enable: boolean,
        msg = `Enter a valid ${this.#attrName} date.`,
    ) {
        if (enable) {
            if (this.#styled) {
                this.#input.classList.add('error');
                this.#input.classList.remove('success');
                this.#errorEl.classList.add('active');
            }
            this.#errorEl.textContent = msg;
            return;
        }
        if (!this.#styled) return;
        this.#errorEl.classList.remove('active');
    }

    #isValidInput(date: string | null = null) {
        if (
            !date ||
            YEAR_MIN_REGEX.test(date) ||
            YEAR_MAX_REGEX.test(date) ||
            YEAR_INCOMPLETE_REGEX.test(date) ||
            !isDateRawType(date)
        ) {
            this.#reset();
            if (this.#attrName === 'start') this.#resetEnd();
            if (!date) return false;
            if (YEAR_MIN_REGEX.test(date))
                this.renderError(true, `Date must be after 2020`);
            if (YEAR_MAX_REGEX.test(date))
                this.renderError(true, `Date must be before 2041`);
            if (YEAR_INCOMPLETE_REGEX.test(date))
                this.renderError(true, `Enter a valid date.`);
            return false;
        }
        return true;
    }

    async #isStartBeforeEnd() {
        if (!this.#startDateInputVal) return false;
        if (!this.#endDateInputVal) return true;
        if (
            Date.parse(this.#startDateInputVal) >
            Date.parse(this.#endDateInputVal)
        ) {
            await this.#startEl.restrictStartInput();
            this.#resetEnd();
            this.#endEl.renderError(true, 'End date must be after start date.');
            return false;
        }
        return true;
    }

    async restrictStartInput() {
        if (!this.#endEl.pdcValue && !this.#prevRow.el) {
            this.enable(true);
            this.#setMax();
            this.#setMin();
            return;
        }
        if (!this.#prevRow.el) this.enable(true);
        if (this.#endEl.pdcValue) this.#setMax(this.#endEl.pdcValue);
        this.#updateStartBasedOnPrevEnd();
    }

    restrictEndInput() {
        if (!this.#startEl.pdcValue) {
            this.enable(false);
            this.#setMin();
            this.#setMax();
            return;
        } else {
            this.enable(true);
            this.#setMin(this.#startEl.pdcValue);
        }
        this.#updateEndBasedOnNextStart();
    }

    validate() {
        this.#valid = false;
        const attr = this.getAttribute(this.#attrName);
        if (!(attr && isDateRawType(attr))) {
            this.renderError(true);
            return this.#valid;
        }
        this.#valid = true;
        return this.#valid;
    }

    /* GET DATA METHODS
     */
    get inputValue() {
        return this.#input.value;
    }

    get #startDateInputVal() {
        return (
                this.#startEl.inputValue &&
                    isDateRawType(this.#startEl.inputValue)
            ) ?
                this.#startEl.inputValue
            :   null;
    }

    get #endDateInputVal() {
        return this.#endEl.inputValue && isDateRawType(this.#endEl.inputValue) ?
                this.#endEl.inputValue
            :   null;
    }

    get isEnabled() {
        return this.#enabled;
    }

    get pdcValue() {
        const value = this.getAttribute(this.#attrName);
        return !!value && isDateRawType(value) ? value : null;
    }
}
