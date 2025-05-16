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
        const bgColor = this.getAttribute('bg-color');
        const borderColor = this.getAttribute('border-color');
        const text = this.getAttribute('text');
        const textColor = this.getAttribute('text-color');

        if (!(this.shadowRoot && bgColor && borderColor && text && textColor))
            throw new Error('Failed to render button.');

        let btnMarkup =
            this.#styled ? templateHTML : removeStyles(templateHTML);
        btnMarkup = btnMarkup
            .replaceAll('BG_COLOR', bgColor)
            .replaceAll('BORDER_COLOR', borderColor)
            .replaceAll('BTN_TEXT', text)
            .replaceAll('TEXT_COLOR', textColor);
        template.innerHTML = btnMarkup;

        if (this.#styled) {
            applyStyles(this.shadowRoot);
        }

        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}
