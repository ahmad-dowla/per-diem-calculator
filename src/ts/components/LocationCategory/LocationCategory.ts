// Types

// Utils
import { handlePointerDown, handlePointerUp } from '../../utils/misc';
import { applyStyles, removeStyles } from '../../utils/styles';

// HTML/CSS
import templateHTML from './template.html?raw';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcLocationCategory extends HTMLElement {
    /* SETUP
     */
    static observedAttributes = ['bg'];

    #valid = false;
    #styled = false;
    #enabled = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#styled = this.getAttribute('styled') === 'true';
        this.#render();
    }

    #render() {
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.#shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.#shadowRoot.appendChild(template.content.cloneNode(true));
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
        // Mouse, touch events
        let pointerStartX = 0;
        let pointerStartY = 0;

        this.#container.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });

        this.#container.addEventListener('pointerup', e => {
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
        this.#container.addEventListener('keydown', e => {
            if (!(e instanceof KeyboardEvent)) return;
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });
    }

    #handleClicks(e: Event) {
        if (!this.#enabled) return;
        const target = e.composedPath()[0];
        if (!(target instanceof HTMLElement || target instanceof SVGElement))
            return;
        const label = target.closest('label');
        const labelVal = label?.getAttribute('for');
        // In case the selection was made with keyboard presses, ensure the input fields are properly checked/unchecked so that the CSS can reflect that
        const checkedInput = this.#container.querySelector<HTMLInputElement>(
            `#${labelVal}`,
        );
        const uncheckedInput = this.#container.querySelector<HTMLInputElement>(
            `#${labelVal === 'domestic' ? 'intl' : 'domestic'}`,
        );
        if (!(checkedInput && uncheckedInput)) return;
        uncheckedInput.checked = false;
        checkedInput.checked = true;
        if (labelVal) this.setAttribute('category', labelVal);
        if (this.#styled) {
            label?.classList.add('success');
            this.#renderError(false);
        }
    }

    /* GET ELS
     */
    get #container() {
        const el = this.#shadowRoot.querySelector('#pdc-container');
        if (!el)
            throw new Error(
                `Failed to render container for Category custom element`,
            );
        return el;
    }

    get #inputs() {
        const els = this.#shadowRoot.querySelectorAll('input');
        if (!els)
            throw new Error(
                `Failed to render inputs in Category custom element`,
            );
        return els;
    }

    get #labels() {
        const els = this.#shadowRoot.querySelectorAll('label');
        if (!els)
            throw new Error(
                `Failed to render labels in Category custom element`,
            );
        return els;
    }

    get #shadowRoot() {
        if (!this.shadowRoot)
            throw new Error(
                `Failed to render shadowRoot in Category custom element`,
            );
        return this.shadowRoot;
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
        this.#container.classList.remove(`bg-white`, `bg-neutral-50`);
        this.#container.classList.add(
            bgColor ? bgColor : `bg-${this.getAttribute('bg')}`,
        );
    }

    focusEl() {
        [...this.#labels][1].focus();
    }

    /* UPDATE METHODS
     */
    enable(enable: boolean) {
        this.removeAttribute('category');
        this.#inputs.forEach(input => {
            input.checked = false;
            if (enable) {
                input.removeAttribute('disabled');
                this.#container.removeAttribute('inert');
            } else {
                input.setAttribute('disabled', 'true');
                this.#container.setAttribute('inert', '');
            }
        });
        this.enableTabIndex(enable);
        this.#enabled = enable;
    }

    enableTabIndex(enable: boolean) {
        const els = this.#container.querySelectorAll('[tabindex]');
        els.forEach(el => el.setAttribute('tabindex', enable ? '0' : '-1'));
    }

    /* VALIDATION
     */
    #renderError(enable: boolean, msg = `Select an area.`) {
        if (enable) {
            if (this.#styled) {
                this.#labels.forEach((label, i) => {
                    if (i > 0) label.classList.add('error');
                });
                this.#errorEl.classList.add('active');
            }
            this.#errorEl.textContent = msg;
            return;
        }
        if (!this.#styled) return;
        this.#labels.forEach((label, i) => {
            if (i > 0) label.classList.remove('error');
        });
        this.#errorEl.classList.remove('active');
    }

    validate() {
        this.#valid = false;
        if (!this.hasAttribute('category')) {
            this.#renderError(true);
            return this.#valid;
        }
        this.#valid = true;
        return this.#valid;
    }

    /* GET DATA METHODS
     */
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
