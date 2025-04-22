import type { LodgingRow } from '../config';

const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <div>
    <span id="date"></span>
    <span id="location"></span>
    <span id="max-rate"></span>
    <input id="amount" type="number" inputmode="decimal" step="0.01" min="0" />
    <span id="error-message"></span>
  </div>
`;

export default class PdcMealsRow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  addRow(obj: LodgingRow) {
    const dateEl = this.shadowRoot?.querySelector('#date');
    const locationEl = this.shadowRoot?.querySelector('#location');
    const maxRateEl = this.shadowRoot?.querySelector('#max-rate');
    const amountEl =
      this.shadowRoot?.querySelector<HTMLInputElement>('#amount');

    if (!(dateEl && locationEl && maxRateEl && amountEl)) return;

    const { date, location, maxRate } = obj;

    dateEl.textContent = date;
    locationEl.textContent = location;
    maxRateEl.textContent = maxRate.toString();
    amountEl.value = maxRate.toFixed(2);
    amountEl.setAttribute('max', obj.maxRate.toString());
  }
}
