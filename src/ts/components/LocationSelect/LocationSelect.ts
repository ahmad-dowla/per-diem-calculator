// Types
import type { Location } from '../../types/locations';

// Utils
import { applyStyles, removeStyles } from '../../utils/styles';
import { debounce, handlePointerDown, handlePointerUp } from '../../utils/misc';
import TomSelect from 'tom-select';

// HTML/CSS
import templateHTML from './template.html?raw';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcLocationSelect extends HTMLElement {
    /* SETUP
     */
    static observedAttributes = ['bg'];
    #attrName: 'country' | 'city';
    #valid = false;
    #styled = false;
    #enabled = false;
    #tomSelect: TomSelect;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#attrName =
            this.getAttribute('pdc') === 'country' ? 'country' : 'city';
        this.#styled = this.getAttribute('styled') === 'true';
        this.#tomSelect = this.#render();
    }

    #render() {
        this.removeAttribute(this.#attrName);
        this.#shadowRoot.innerHTML = '';
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.#shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.#shadowRoot.appendChild(template.content.cloneNode(true));
        this.#label.textContent =
            this.#attrName === 'country' ? 'State' : 'City';
        this.#label.setAttribute(
            'aria-label',
            `Select the trip ${this.#attrName === 'country' ? 'state' : 'city'}`,
        );
        this.#addEventListeners();
        return this.#createTomSelect();
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
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerUp(
                e,
                this.#handleClicks.bind(this),
                pointerStartX,
                pointerStartY,
            );
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });

        // Keyboard events
        this.#container.addEventListener('keydown', e => {
            if (!(e instanceof KeyboardEvent)) return;
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });
    }

    #handleClicks = (e: Event) => {
        const target = e.target;
        console.log(e.target);
        if (
            !(
                (target instanceof HTMLElement ||
                    target instanceof SVGElement) &&
                (target.closest('.ts-control') || target.closest('button'))
            )
        )
            return;
        const handler = debounce(() => {
            this.#tomSelect.open();
        });
        handler();
    };

    /* Get Els
     */

    get #container() {
        const el =
            this.#shadowRoot.querySelector<HTMLElement>('#pdc-container');
        if (!el)
            throw new Error(
                `Failed to get container for Select custom element`,
            );
        return el;
    }

    get #select() {
        const el = this.#shadowRoot.querySelector('select');
        if (!el)
            throw new Error(`Failed to get select for Select custom element`);
        return el;
    }

    get #button() {
        const el = this.#shadowRoot.querySelector('button');
        if (!el)
            throw new Error(`Failed to get button for Select custom element`);
        return el;
    }

    get #label() {
        const el = this.#shadowRoot.querySelector('label');
        if (!el)
            throw new Error(`Failed to get label for Select custom element`);
        return el;
    }

    get #loadingSpinner() {
        const el = this.#shadowRoot.querySelector('#loading-spinner');
        if (!el)
            throw new Error(
                `Failed to get loading spinner element for Select custom element`,
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

    get #shadowRoot() {
        if (!this.shadowRoot)
            throw new Error(
                `Failed to render shadowRoot in Select custom element`,
            );
        return this.shadowRoot;
    }

    /* VISUAL METHODS
     */
    #styleEl(bgColor: 'bg-white' | 'bg-neutral-50' | null = null) {
        if (!this.#styled) return;
        const div = this.#shadowRoot.querySelector('div');
        div?.classList.remove(`bg-white`, `bg-neutral-50`);
        div?.classList.add(bgColor ? bgColor : `bg-${this.getAttribute('bg')}`);
    }

    #showLoadingSpinner(enabled: boolean) {
        if (!this.#styled) return;
        if (enabled) this.#loadingSpinner.classList.add('active');
        else this.#loadingSpinner.classList.remove('active');
    }

    focusEl() {
        this.#tomSelect.control.focus();
    }

    /* UPDATE METHODS
     */
    enableTabIndex(enable: boolean) {
        this.#button.setAttribute('tabindex', enable ? '0' : '-1');
    }

    enable(enable: boolean) {
        this.removeAttribute(this.#attrName);
        if (enable) {
            this.#tomSelect.enable();
            this.#container.classList.add('active');
            this.#container.removeAttribute('inert');
        } else {
            this.#tomSelect.disable();
            this.#container.classList.remove('active', 'success');
            this.#container.setAttribute('inert', '');
        }
        this.enableTabIndex(enable);
        this.#container.classList.remove('success', 'error');
        this.#enabled = enable;
    }

    setOptions(locations: Location[]) {
        this.#showLoadingSpinner(true);
        this.enable(false);
        this.#tomSelect.destroy();
        this.#createTomSelect();
        locations.forEach(location => {
            const value =
                this.#attrName === 'country' ? location.country : location.city;
            if (!location.label || !value)
                throw new Error(
                    `Failed to get label when creating the options for ${location}.`,
                );
            const option = document.createElement('option');
            option.setAttribute('value', value);
            option.textContent = location.label;
            this.#select.appendChild(option);
            this.#tomSelect.sync();
        });
        this.enable(true);
        this.#tomSelect.on('change', () => {
            const value = this.#tomSelect.getValue();
            if (Array.isArray(value)) return; // Ensures string value as TomSelect can return string[] if multiple selection enabled
            this.setAttribute(this.#attrName, value);

            if (this.#styled) {
                this.#renderError(false);
                this.#container.classList.remove('error');
                this.#container.classList.add('success');
            }
            this.#tomSelect.control.setAttribute('tabindex', '-1');
        });
        this.#showLoadingSpinner(false);
    }

    #createTomSelect() {
        const noResultsText =
            this.#attrName === 'city' ?
                `No results
        found. Choose the first available option such as "Standard Rate", "[OTHER]", etc.`
            :   `No results found.`;
        const tomSelect = new TomSelect(this.#select, {
            placeholder: `Select ${this.#attrName === 'country' ? 'state' : 'city'}`,
            maxItems: 1,
            plugins: ['dropdown_input'],
            selectOnTab: true,
            openOnFocus: false,
            render: {
                no_results: () => {
                    return /* HTML */ ` <div class="no-results">
                        ${noResultsText}
                    </div>`;
                },
            },
        });
        this.#tomSelect = tomSelect;
        this.#tomSelect.disable();
        this.#tomSelect.tabIndex = -1;
        this.enableTabIndex(false);
        this.#styleEl();
        return tomSelect;
    }

    /* VALIDATION
     */
    #renderError(enable: boolean) {
        if (enable) {
            if (this.#styled) {
                this.#container.classList.add('error');
                this.#errorEl.classList.add('active');
            }
            this.#errorEl.textContent =
                this.#attrName === 'country' ? `Select state.` : `Select city.`;
            return;
        }
        if (!this.#styled) return;
        this.#container.classList.remove('error');
        this.#errorEl.classList.remove('active');
    }

    validate() {
        this.#valid = false;
        if (!this.hasAttribute(this.#attrName)) {
            if (this.#styled) this.#renderError(true);
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
        const value = this.getAttribute(this.#attrName);
        return value ? value : null;
    }
}
