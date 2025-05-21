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
            ?.querySelector('fieldset')
            ?.classList.remove(`bg-white`, `bg-neutral-50`);
        this.shadowRoot
            ?.querySelector('fieldset')
            ?.classList.add(
                bgColor ? bgColor : `bg-${this.getAttribute('bg')}`,
            );
    }

    #valid: boolean = false;
    #errorEl: Element;
    #styled = false;
    #enabled = false;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#styled = this.getAttribute('styled') === 'true';
        this.#render();
        const { errorEl } = this.#getEls();
        this.#errorEl = errorEl;
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

        const { fieldset, errorEl } = this.#getEls();
        this.#errorEl = errorEl;
        this.enableTabIndex(false);
        this.#setBg();

        // Event listener for clicks
        let pointerStartX = 0;
        let pointerStartY = 0;

        fieldset.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });

        fieldset.addEventListener('pointerup', e => {
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
        fieldset.addEventListener('keydown', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });
    }

    #getEls = () => {
        const fieldset = this.shadowRoot?.querySelector('fieldset');
        const errorEl = this.closest('#locations-container')?.querySelector(
            '#error',
        );
        const inputs = this.shadowRoot?.querySelectorAll('input');
        const labels = this.shadowRoot?.querySelectorAll('label');
        if (!(errorEl && fieldset && inputs && labels))
            throw new Error(
                `Failed to render category's elements in Location view.`,
            );
        return { fieldset, errorEl, inputs, labels };
    };

    #handleClicks(e: Event) {
        if (!this.#enabled) return;
        const target = e.composedPath()[0];
        if (!(target instanceof HTMLElement || target instanceof SVGElement))
            return;
        const { fieldset } = this.#getEls();
        const label = target.closest('label');
        const labelVal = label?.getAttribute('for');
        // In case the selection was made with keyboard presses, ensure the input fields are properly checked/unchecked so that the CSS can reflect that
        const checkedInput = fieldset.querySelector<HTMLInputElement>(
            `#${labelVal}`,
        );
        const uncheckedInput = fieldset.querySelector<HTMLInputElement>(
            `#${labelVal === 'domestic' ? 'intl' : 'domestic'}`,
        );
        if (!(checkedInput && uncheckedInput)) return;
        uncheckedInput.checked = false;
        checkedInput.checked = true;
        labelVal && this.setAttribute('category', labelVal);
        if (this.#styled) {
            label?.classList.add('success');
            this.#renderError(false);
        }
    }

    enable(enable: boolean) {
        this.#render();
        const { inputs } = this.#getEls();
        setTimeout(() => {
            // To allow for transitions to happen after immmediate rerender
            inputs.forEach(input => {
                enable ?
                    input.removeAttribute('disabled')
                :   input.setAttribute('disabled', 'true');
            });
        }, 50);
        this.enableTabIndex(enable);
        this.#enabled = enable;
    }

    enableTabIndex(enable: boolean) {
        const { fieldset } = this.#getEls();
        const els = fieldset.querySelectorAll('[tabindex]');
        enable ?
            els.forEach(el => el.setAttribute('tabindex', '0'))
        :   els.forEach(el => el.setAttribute('tabindex', '-1'));
    }

    #renderError(enable: boolean, msg: string = `Select a category.`) {
        if (enable) {
            if (this.#styled)
                this.#getEls().labels.forEach(label =>
                    label.classList.add('error'),
                );
            this.#errorEl.textContent = msg;
            this.#errorEl.classList.add('active');
            return;
        }
        if (this.#styled) {
            this.#getEls().labels.forEach(label =>
                label.classList.remove('error'),
            );
            this.#errorEl.classList.remove('active');
        }
    }

    validate() {
        this.#valid = false;
        if (!this.hasAttribute('category')) {
            if (this.#styled) this.#renderError(true);
            return this.#valid;
        }
        this.#valid = true;
        return this.#valid;
    }

    focusEl() {
        const { labels } = this.#getEls();
        [...labels][0].focus();
    }

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
