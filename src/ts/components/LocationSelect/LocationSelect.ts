// Types
import type { Location } from '../../types/locations';

// Utils
import {
    applyStyles,
    removeStyles,
    highlightSuccess,
    highlightError,
} from '../../utils/styles';
import TomSelect from 'tom-select';

// HTML/CSS
import templateHTML from './template.html?raw';
import stylesTomSelect from 'tom-select/dist/css/tom-select.default.css?inline';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcLocationSelect extends HTMLElement {
    #attrName: 'country' | 'city';
    #valid = false;
    #select: HTMLSelectElement;
    #tomSelect: TomSelect;
    #styled = false;
    #error: Element;
    #enabled = false;

    constructor() {
        super();
        this.#attrName =
            this.getAttribute('pdc') === 'country' ? 'country' : 'city';
        this.#styled = this.getAttribute('styled') === 'true';
        this.attachShadow({ mode: 'open' });
        const render = this.#render();
        const { select, error } = this.#getEls();
        this.#select = select;
        this.#error = error;
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

        const { select, label, error } = this.#getEls();

        label.textContent = this.#attrName === 'country' ? 'State' : 'City';
        const noResultsText =
            this.#attrName === 'city' ?
                `No results
        found.<br><br>Choose the first available option.<br><br>E.g. Standard Rate, [OTHER], etc.`
            :   `No results found.`;
        const tomSelect = new TomSelect(select, {
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
        this.#error = error;
        this.#tomSelect = tomSelect;
        this.enableTabIndex(false);
        return { tomSelect }; // Returning only for constructor
    }

    #getEls = () => {
        const select =
            this.shadowRoot?.querySelector<HTMLSelectElement>('select');
        const label = this.shadowRoot?.querySelector<HTMLLabelElement>('label');
        const error = this.shadowRoot?.querySelector<HTMLElement>('#error');
        if (!(select && label && error))
            throw new Error(
                `Failed to render elements for pdc-location-${this.#attrName} in location View.`,
            );

        return { select, label, error };
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

        ['click', 'keyup'].forEach(event => {
            this.#tomSelect.control.addEventListener(event, e => {
                const target = e.composedPath()[0];
                console.log(target);
                if (
                    !(
                        target instanceof HTMLElement &&
                        target.classList.contains('ts-control')
                    )
                )
                    return;
                if (e instanceof KeyboardEvent && e.type === 'keyup')
                    if (!(e.key === 'Enter' || e.key === ' ')) return;
                this.#tomSelect.open();
            });
        });

        this.#tomSelect.on('change', () => {
            const value = this.#tomSelect.getValue();
            if (Array.isArray(value)) return; // Ensures string value as TomSelect can return string[] if multiple selection enabled
            this.setAttribute(this.#attrName, value);

            if (this.#styled) {
                this.#renderError(false);
                highlightSuccess(this.#tomSelect.control);
            }

            this.#tomSelect.control.blur();
        });
    }

    #renderError(enable: boolean) {
        if (enable) {
            highlightError(this.#tomSelect.control);
            const msg =
                this.#attrName === 'country' ?
                    `Select a state.`
                :   `Select a city.`;
            this.#error.textContent = msg;
            this.#error.classList.add('active');
            return;
        }
        this.#error.classList.remove('active');
        setTimeout(() => {
            this.#error.innerHTML = '&nbsp;';
        }, 300);
    }

    enableTabIndex(enable: boolean) {
        enable ?
            this.#tomSelect.control.setAttribute('tabindex', '0')
        :   this.#tomSelect.control.setAttribute('tabindex', '-1');
    }

    focusEl() {
        this.#tomSelect.control.focus();
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
