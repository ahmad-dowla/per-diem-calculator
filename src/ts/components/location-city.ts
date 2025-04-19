import { LocationFromFetch } from '../config';

const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <select>
    <option disabled selected value>-- select city --</option>
  </select>
`;

export default class PdcLocationCity extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  set options(arr: LocationFromFetch[]) {
    this.emptyOptions();

    const select = this.shadowRoot?.querySelector('select');
    if (!select) return;

    arr.forEach(rate => {
      const { City: city } = rate;
      const option = document.createElement('option');
      option.setAttribute('value', city);
      option.innerHTML = city;
      select.appendChild(option);
    });

    select.addEventListener('change', e => {
      const target = e.target;
      if (target instanceof HTMLSelectElement) this.setAttribute('city', target.value);
    });
  }

  emptyOptions() {
    // emtpy element and recreate using template
    if (this.shadowRoot) this.shadowRoot.innerHTML = '';
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }
}
