// Utils
import { applyStyles, removeStyles } from '../../utils/styles';

// HTML/CSS
import templateHTML from './template.html?raw';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcLabel extends HTMLElement {
    static observedAttributes = ['text'];

    #styled = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        if (!this.shadowRoot)
            throw new Error('Failed to render shadowRoot for label.');

        this.#styled = this.getAttribute('styled') === 'true';
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);

        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    attributeChangedCallback(
        _name: string,
        _oldValue: string,
        newValue: string,
    ) {
        this.shadowRoot
            ?.querySelector('label')
            ?.insertAdjacentHTML('afterbegin', newValue);
    }
}
