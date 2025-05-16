// Types

// Utils
import { handlePointerDown, handlePointerUp } from '../../utils/misc';
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
export class PdcLocationCategory extends HTMLElement {
    #valid: boolean = false;
    #error: Element;
    #styled = false;
    #enabled = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#styled = this.getAttribute('styled') === 'true';
        this.#render();
        const { error } = this.#getEls();
        this.#error = error;
    }

    #render() {
        this.removeAttribute('category');
        if (!this.shadowRoot)
            throw new Error(
                'Failed to render ShadowRoot for category in location View.',
            );
        this.shadowRoot.innerHTML = '';

        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        const { fieldset, error } = this.#getEls();
        this.#error = error;
        this.enableTabIndex(false);

        // Event listener for clicks
        let pointerStartX = 0;
        let pointerStartY = 0;

        fieldset.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });

        fieldset.addEventListener('pointerup', e => {
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
        fieldset.addEventListener('keyup', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });
    }

    #getEls = () => {
        const fieldset = this.shadowRoot?.querySelector('fieldset');
        const error = this.shadowRoot?.querySelector('#error');
        const inputs = this.shadowRoot?.querySelectorAll('input');
        const labels = this.shadowRoot?.querySelectorAll<HTMLLabelElement>(
            'label[data-pdc="label"]',
        );
        if (!(error && fieldset && inputs && labels))
            throw new Error(
                `Failed to render category's elements in Location view.`,
            );
        return { fieldset, error, inputs, labels };
    };

    #handleClicks(e: Event) {
        if (!this.#enabled) return;
        const target = e.composedPath()[0];
        if (!(target instanceof HTMLElement || target instanceof SVGElement))
            return;
        const { fieldset } = this.#getEls();
        const label = target.closest('label');
        const labelVal = label?.getAttribute('for');
        // In case the selection was made with keyboard presses, ensure the input fields are properly checked/unchecked so that the CSS can reflect that
        const checkedInput = fieldset.querySelector<HTMLInputElement>(
            `#${labelVal}`,
        );
        const uncheckedInput = fieldset.querySelector<HTMLInputElement>(
            `#${labelVal === 'domestic' ? 'intl' : 'domestic'}`,
        );
        if (!(checkedInput && uncheckedInput)) return;
        uncheckedInput.checked = false;
        checkedInput.checked = true;
        labelVal && this.setAttribute('category', labelVal);
        if (this.#styled) label && highlightSuccess(label);
        if (this.#styled) this.#renderError(false);
    }

    enableCategory(enable: boolean) {
        this.#render();
        const { inputs } = this.#getEls();
        inputs.forEach(input => {
            enable ?
                input.removeAttribute('disabled')
            :   input.setAttribute('disabled', 'true');
        });
        this.enableTabIndex(enable);
        this.#enabled = enable;
    }

    enableTabIndex(enable: boolean) {
        const { fieldset } = this.#getEls();
        const els = fieldset.querySelectorAll('[tabindex]');
        enable ?
            els.forEach(el => el.setAttribute('tabindex', '0'))
        :   els.forEach(el => el.setAttribute('tabindex', '-1'));
    }

    #renderError(enable: boolean, msg: string = `Select a category.`) {
        if (enable) {
            this.#error.textContent = msg;
            this.#error.classList.add('active');
            return;
        }
        this.#error.classList.remove('active');
        setTimeout(() => {
            this.#error.innerHTML = '&nbsp;';
        }, 300);
    }

    validate() {
        this.#valid = false;
        if (!this.hasAttribute('category')) {
            const { labels } = this.#getEls();
            if (this.#styled) labels.forEach(label => highlightError(label));
            if (this.#styled) this.#renderError(true);
            return this.#valid;
        }
        this.#valid = true;
        return this.#valid;
    }

    focusEl(number: 0 | 1) {
        const { labels } = this.#getEls();
        [...labels][number].focus();
    }

    get isEnabled() {
        return this.#enabled;
    }

    get pdcValue() {
        const value = this.getAttribute('category');
        return value && (value === 'domestic' || value === 'intl') ?
                value
            :   null;
    }
}
