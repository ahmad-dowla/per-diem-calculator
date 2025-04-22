import type { LocationCities } from '../config';

const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <select>
    <option disabled selected value>-- select city --</option>
  </select>
  <span id="error-message"></span>
`;

export default class PdcLocationCity extends HTMLElement {
  #valid: boolean = false;
  #selectEl: HTMLSelectElement | null | undefined;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.resetOptions();
  }

  resetOptions() {
    // emtpy element and recreate using template
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    const selectEl = this.shadowRoot.querySelector<HTMLSelectElement>('select');
    if (!selectEl) return;
    this.#selectEl = selectEl;
  }

  #createOption(city: string) {
    if (!this.#selectEl) return;
    const option = document.createElement('option');
    option.setAttribute('value', city);
    option.innerHTML = city;
    this.#selectEl.appendChild(option);
  }

  #addListener() {
    if (!this.#selectEl) return;
    this.#selectEl.addEventListener('change', e => {
      const target = e.target;
      target instanceof HTMLSelectElement && this.setAttribute('city', target.value);
    });
  }

  set setOptionsdomestic(cityResults: LocationCities[]) {
    this.resetOptions();
    cityResults.forEach(result => {
      const { City: city } = result;
      city && this.#createOption(city);
    });
    this.#addListener();
  }

  set setOptionsintl(cityResults: LocationCities[]) {
    this.resetOptions();
    cityResults.forEach(result => {
      const { Location: city } = result;
      city && this.#createOption(city);
    });
    this.#addListener();
  }

  validate() {
    const error = this.shadowRoot?.querySelector('#error-message');
    if (!error) return false;
    error.textContent = '';

    if (this.hasAttribute('city')) {
      this.#valid = true;
      return;
    }

    error.textContent = 'City must be selected';
  }

  get valid() {
    return this.#valid;
  }
}
