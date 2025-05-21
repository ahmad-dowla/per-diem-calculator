// Types
import type { Location } from '../../types/locations';

// Utils
import { applyStyles, removeStyles } from '../../utils/styles';
import {
    debounce,
    handlePointerDown,
    handlePointerUp,
    wait,
} from '../../utils/misc';
import TomSelect from 'tom-select';

// HTML/CSS
import templateHTML from './template.html?raw';
import stylesTomSelect from 'tom-select/dist/css/tom-select.default.css?inline';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcLocationSelect extends HTMLElement {
    static observedAttributes = ['bg'];

    attributeChangedCallback(
        _name: string,
        _oldValue: string,
        newValue: string,
    ) {
        if (
            !(
                this.#styled &&
                (newValue === 'white' || newValue === 'neutral-50')
            )
        )
            return;
        this.#setBg(`bg-${newValue}`);
    }

    #setBg(bgColor: 'bg-white' | 'bg-neutral-50' | null = null) {
        if (!this.#styled) return;
        this.shadowRoot
            ?.querySelector('div')
            ?.classList.remove(`bg-white`, `bg-neutral-50`);
        this.shadowRoot
            ?.querySelector('div')
            ?.classList.add(
                bgColor ? bgColor : `bg-${this.getAttribute('bg')}`,
            );
    }

    #attrName: 'country' | 'city';
    #valid = false;
    #select: HTMLSelectElement;
    #tomSelect: TomSelect;
    #styled = false;
    #errorEl: Element;
    #loadingSpinner: Element;
    #enabled = false;

    constructor() {
        super();
        this.#attrName =
            this.getAttribute('pdc') === 'country' ? 'country' : 'city';
        this.#styled = this.getAttribute('styled') === 'true';
        this.attachShadow({ mode: 'open' });
        const render = this.#render();
        const { select, errorEl, loadingSpinner } = this.#getEls();
        this.#select = select;
        this.#errorEl = errorEl;
        this.#loadingSpinner = loadingSpinner;
        this.#tomSelect = render.tomSelect;
        this.enableTabIndex(false);
    }

    #render() {
        // Reset by removing previously assigned attributes, emptying contents, and rerendering
        this.removeAttribute(this.#attrName);
        if (!this.shadowRoot)
            throw new Error(
                `Failed to render ShadowRoot for pdc-location-${this.#attrName} in location View.`,
            );
        this.shadowRoot.innerHTML = '';

        if (this.#styled) {
            template.innerHTML = `<style>${stylesTomSelect}</style>${templateHTML}`;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);

        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.#setBg();

        const { select, label, errorEl, loadingSpinner } = this.#getEls();

        label.setAttribute(
            'text',
            this.#attrName === 'country' ? 'State' : 'City',
        );
        const noResultsText =
            this.#attrName === 'city' ?
                `No results
        found.<br><br>Choose the first available option.<br><br>E.g. Standard Rate, [OTHER], etc.`
            :   `No results found.`;
        const tomSelect = new TomSelect(select, {
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

        tomSelect.disable();

        this.#select = select;
        this.#errorEl = errorEl;
        this.#loadingSpinner = loadingSpinner;
        this.#tomSelect = tomSelect;
        this.enableTabIndex(false);
        return { tomSelect }; // Returning only for constructor
    }

    #getEls = () => {
        const select =
            this.shadowRoot?.querySelector<HTMLSelectElement>('select');
        const label = this.shadowRoot?.querySelector('pdc-label');
        const errorEl = this.closest('#locations-container')?.querySelector(
            '#error',
        );
        const loadingSpinner =
            this.shadowRoot?.querySelector('#loading-spinner');
        if (!(select && label && errorEl && loadingSpinner))
            throw new Error(
                `Failed to render elements for pdc-location-${this.#attrName} in location View.`,
            );

        return { select, label, errorEl, loadingSpinner };
    };

    enable(enable: boolean) {
        this.#render();
        enable ? this.#tomSelect.enable() : this.#tomSelect.disable();
        this.enableTabIndex(enable);
        this.#enabled = enable;
    }

    setOptions(locations: Location[]) {
        locations.forEach(location => {
            const { label } = location;
            const value =
                this.#attrName === 'country' ? location.country : location.city;
            if (!label || !value)
                throw new Error(
                    `Failed to get label when creating the country options for ${location}.`,
                );
            const option = document.createElement('option');
            option.setAttribute('value', value);
            option.textContent = label;
            this.#select.appendChild(option);
            this.#tomSelect.sync();
        });

        // Mouse, touch events
        let pointerStartX = 0;
        let pointerStartY = 0;
        this.#tomSelect.control.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        this.#tomSelect.control.addEventListener('pointerup', e => {
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
        this.#tomSelect.control.addEventListener('keydown', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });

        this.#tomSelect.on('change', () => {
            const value = this.#tomSelect.getValue();
            if (Array.isArray(value)) return; // Ensures string value as TomSelect can return string[] if multiple selection enabled
            this.setAttribute(this.#attrName, value);

            if (this.#styled) {
                this.#renderError(false);
                this.#tomSelect.control.classList.remove('error');
                this.#tomSelect.control.classList.add('success');
            }

            this.#tomSelect.focus();
        });
    }

    #handleClicks = (e: Event) => {
        const target = e.target;
        if (!(target instanceof HTMLElement && target.closest('.ts-control')))
            return;
        const handler = debounce(() => {
            this.#tomSelect.open();
        }, 50);
        handler();
    };

    async #renderError(enable: boolean) {
        if (enable) {
            this.#styled && this.#tomSelect.control.classList.add('error');
            const msg =
                this.#attrName === 'country' ? `Select state.` : `Select city.`;
            this.#errorEl.textContent = msg;
            this.#errorEl.classList.add('active');
            return;
        }
        this.#tomSelect.control.classList.remove('error');
        this.#errorEl.classList.remove('active');
        // MAGIC 300
        await wait(300);
        this.#errorEl.innerHTML = '&nbsp;';
    }

    enableTabIndex(enable: boolean) {
        enable ?
            this.#tomSelect.control.setAttribute('tabindex', '0')
        :   this.#tomSelect.control.setAttribute('tabindex', '-1');
    }

    focusEl() {
        this.#tomSelect.control.focus();
    }

    showLoadingSpinner(enabled: boolean) {
        if (!this.#styled) return;
        enabled ?
            this.#loadingSpinner.classList.add('active')
        :   this.#loadingSpinner.classList.remove('active');
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
    get isEnabled() {
        return this.#enabled;
    }
    get pdcValue() {
        const value = this.getAttribute(this.#attrName);
        return value ? value : null;
    }
}
