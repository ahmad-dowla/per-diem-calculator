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
    #errorContainer: Element | null = null;
    #errorMsgEl: Element | null = null;
    #styled = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#styled = this.getAttribute('styled') === 'true';
        this.#render();
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
        const errorContainer = this.closest(
            '[data-pdc="location-row"]',
        )?.querySelector('#error');
        const errorMsgEl = errorContainer?.querySelector('#error-message');
        if (!(errorContainer && errorMsgEl))
            throw new Error(
                `Failed to render category's error elements in Location view.`,
            );
        this.#errorContainer = errorContainer;
        this.#errorMsgEl = errorMsgEl;

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

    #handleClicks(e: Event) {
        const target = e.composedPath()[0];
        const input = this.shadowRoot?.querySelector('input:not([disabled])');
        if (
            !(
                input &&
                (target instanceof HTMLElement || target instanceof SVGElement)
            )
        )
            return;
        if (!input) return;
        const label = target.closest('label');
        const labelVal = label?.getAttribute('for');
        labelVal && this.setAttribute('category', labelVal);
        if (this.#styled) label && highlightSuccess(label);
        if (this.#styled) this.#renderError(false);
    }

    enableCategory(enable: boolean) {
        this.#render();
        const inputs = this.shadowRoot?.querySelectorAll('input');
        if (!inputs)
            throw new Error(
                'Failed to get category input fieldset in location View.',
            );
        inputs.forEach(input => {
            enable ?
                input.removeAttribute('disabled')
            :   input.setAttribute('disabled', 'true');
        });
    }

    #renderError(
        enable: boolean,
        msg: string = `Select the location category.`,
    ) {
        if (!(this.#errorContainer && this.#errorMsgEl))
            throw new Error(
                `Failed to render category's error elements in Location view.`,
            );
        if (enable) {
            this.#errorMsgEl.textContent = msg;
            this.#errorContainer.classList.add('active');
            return;
        }
        this.#errorMsgEl.textContent = msg;
        this.#errorContainer.classList.remove('active');
    }

    validate() {
        this.#valid = false;
        if (!this.hasAttribute('category')) {
            const labels = this.shadowRoot?.querySelectorAll('label');
            if (this.#styled) labels?.forEach(label => highlightError(label));
            if (this.#styled) this.#renderError(true);
            return this.#valid;
        }
        this.#valid = true;
        return this.#valid;
    }

    get pdcValue() {
        const value = this.getAttribute('category');
        return value && (value === 'domestic' || value === 'intl') ?
                value
            :   null;
    }
}
