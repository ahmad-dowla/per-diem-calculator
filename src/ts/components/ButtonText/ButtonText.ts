// Utils
import { applyStyles, removeStyles } from '../../utils/styles';

// HTML/CSS
import templateHTML from './template.html?raw';

// Template for this Custom Element
const template = document.createElement('template');

// Custom Element
export class PdcButtonText extends HTMLElement {
    #styled = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#styled = this.getAttribute('styled') === 'true';

        const text = this.getAttribute('text');
        const title = this.getAttribute('title');

        if (!(this.shadowRoot && text && title))
            throw new Error('Failed to render button.');

        let btnMarkup =
            this.#styled ? templateHTML : removeStyles(templateHTML);

        btnMarkup = btnMarkup.replace('BTN_TEXT', text);
        template.innerHTML = btnMarkup;

        if (this.#styled) {
            applyStyles(this.shadowRoot);
        }

        this.shadowRoot.appendChild(template.content.cloneNode(true));
        const button = this.shadowRoot?.querySelector('button');

        button?.setAttribute('title', title);
    }
}
