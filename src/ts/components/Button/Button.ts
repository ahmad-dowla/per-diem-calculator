// Utils
import { applyStyles, removeStyles } from '../../utils/styles';

// HTML/CSS
import templateHTML from './template.html?raw';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcButton extends HTMLElement {
    /* SETUP
     */
    #styled = false;
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#styled = this.getAttribute('styled') === 'true';
        if (!this.shadowRoot)
            throw new Error(
                'Failed to create shadowRoot for button custom element.',
            );

        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.shadowRoot?.appendChild(template.content.cloneNode(true));

        const textEl = this.#button.querySelector('[data-pdc="text"]');
        const text = this.getAttribute('text');
        const title = this.getAttribute('title');

        if (!(textEl && text && title))
            throw new Error('Failed to render button.');

        this.#button.setAttribute('title', title);
        this.#button.setAttribute('aria-label', `Click to ${title}`);
        textEl.textContent = text;
    }

    get #button() {
        const el = this.shadowRoot?.querySelector('button');
        if (!el) throw new Error('Failed to render button.');
        return el;
    }

    enableTabIndex(enable: boolean) {
        this.#button.setAttribute('tabindex', enable ? '0' : '-1');
    }
}
