import type { LocationFromList } from '../config';

const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <input list="states" autocomplete="off" />
  <datalist id="states"></datalist>
  <span id="error-message"></span>
`;

export default class PdcLocationState extends HTMLElement {
  #valid: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  set options(stateOptions: LocationFromList[]) {
    // delete previously created datalists and create one with new options, and reset the element's state attribute
    this.removeAttribute('state');
    if (this.shadowRoot) this.shadowRoot.innerHTML = '';
    this.shadowRoot?.appendChild(template.content.cloneNode(true));

    const datalist = this.shadowRoot?.querySelector('datalist');
    if (!datalist) return;

    stateOptions.forEach(stateOption => {
      const option = document.createElement('option');
      option.setAttribute('value', stateOption.label);
      option.setAttribute('label', stateOption.label);
      option.setAttribute('data-pdc-state', stateOption.abbreviation);
      option.innerHTML = stateOption.label;
      datalist.appendChild(option);
    });

    const input = this.shadowRoot?.querySelector('input');
    if (input)
      input.addEventListener('change', () => {
        const state = stateOptions.find(
          stateOption => stateOption.label === input.value,
        );
        const stateAttr =
          state?.category === 'domestic' ? state.abbreviation : state?.name;
        stateAttr && this.setAttribute('state', stateAttr);
      });
  }

  validate() {
    const error = this.shadowRoot?.querySelector('#error-message');
    if (!error) return false;
    error.textContent = '';

    if (this.hasAttribute('state')) {
      this.#valid = true;
      return;
    }

    error.textContent = 'State must be selected';
  }

  get valid() {
    return this.#valid;
  }
}
