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
    protected _attrName: 'country' | 'city';
    protected _valid = false;
    protected _select: HTMLSelectElement;
    protected _tomSelect: TomSelect;
    protected _styled = false;
    protected _errorContainer: Element;
    protected _errorMsgEl: Element;

    constructor() {
        super();
        this._attrName =
            this.getAttribute('pdc') === 'country' ? 'country' : 'city';
        this._styled = this.getAttribute('styled') === 'true';
        this.attachShadow({ mode: 'open' });
        const render = this._render();
        this._select = render.select;
        this._tomSelect = render.tomSelect;
        this._errorContainer = render.errorContainer;
        this._errorMsgEl = render.errorMsgEl;
    }

    protected _render() {
        // Reset by removing previously assigned attributes, emptying contents, and rerendering
        this.removeAttribute(this._attrName);
        if (!this.shadowRoot)
            throw new Error(
                `Failed to render ShadowRoot for pdc-location-${this._attrName} in location View.`,
            );
        this.shadowRoot.innerHTML = '';

        if (this._styled) {
            template.innerHTML = `<style>${stylesTomSelect}</style>${templateHTML}`;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        const select =
            this.shadowRoot.querySelector<HTMLSelectElement>('select');
        const label = this.shadowRoot.querySelector<HTMLLabelElement>('label');
        const errorContainer = this.closest(
            '[data-pdc="location-row"]',
        )?.querySelector('#error');
        const errorMsgEl = errorContainer?.querySelector('#error-message');

        if (!(select && label && errorContainer && errorMsgEl))
            throw new Error(
                `Failed to render elements for pdc-location-${this._attrName} in location View.`,
            );

        label.textContent = this._attrName === 'country' ? 'State' : 'City';
        const noResultsText =
            this._attrName === 'city' ?
                `No results
        found.<br><br>Choose the first available option.<br><br>E.g. Standard Rate, [OTHER], etc.`
            :   `No results found.`;
        const tomSelect = new TomSelect(select, {
            maxItems: 1,
            plugins: ['dropdown_input'],
            render: {
                no_results: () => {
                    return /* HTML */ ` <div class="no-results">
                        ${noResultsText}
                    </div>`;
                },
            },
        });

        tomSelect.disable();

        this._select = select;
        this._tomSelect = tomSelect;
        this._errorContainer = errorContainer;
        this._errorMsgEl = errorMsgEl;

        return { select, tomSelect, errorContainer, errorMsgEl }; // Returning only for constructor
    }

    enable(enable: boolean) {
        this._render();
        enable ? this._tomSelect.enable() : this._tomSelect.disable();
    }

    setOptions(locations: Location[]) {
        locations.forEach(location => {
            const { label } = location;
            const value =
                this._attrName === 'country' ? location.country : location.city;
            if (!label || !value)
                throw new Error(
                    `Failed to get label when creating the country options for ${location}.`,
                );
            const option = document.createElement('option');
            option.setAttribute('value', value);
            option.textContent = label;
            this._select.appendChild(option);
            this._tomSelect.sync();
        });

        this._tomSelect.on('change', () => {
            const value = this._tomSelect.getValue();
            if (Array.isArray(value)) return; // Ensures string value as TomSelect can return string[] if multiple selection enabled
            this.setAttribute(this._attrName, value);

            if (this._styled) {
                this._renderError(false);
                highlightSuccess(this._tomSelect.control);
            }
        });

        this._tomSelect.on('dropdown_close', () => this._tomSelect.blur());
    }

    _renderError(enable: boolean) {
        if (enable) {
            const msg =
                this._attrName === 'country' ?
                    `Select a state.`
                :   `Select a city.`;
            this._errorMsgEl.textContent = msg;
            this._errorContainer.classList.add('active');
            return;
        }
        this._errorContainer.classList.remove('active');
    }

    validate() {
        this._valid = false;
        if (!this.hasAttribute(this._attrName)) {
            if (this._styled) this._renderError(true);
            return this._valid;
        }
        this._valid = true;
        return this._valid;
    }

    get pdcValue() {
        const value = this.getAttribute(this._attrName);
        return value ? value : null;
    }
}
