import type { LodgingRow } from '../config';
import style from '../../css/styles.css?inline';

const template = document.createElement('template');

template.innerHTML = /* HTML */ `
  <div id="date"></div>
  <div id="location"></div>
  <div id="max-rate"></div>
  <div>
    <input id="amount" type="number" inputmode="decimal" step="0.01" min="0" />
  </div>
  <div id="error-message"></div>
`;

/* CSS */

template.innerHTML = /* HTML */ `
  <style>
    ${style}
  </style>
  <div class="grid grid-cols-4 gap-4">
    <div id="date"></div>
    <div id="location"></div>
    <div id="max-rate"></div>
    <div>
      <input id="amount" type="number" inputmode="decimal" step="0.01" min="0" />
    </div>
    <div id="error-message"></div>
  </div>
`;

export default class PdcLodgingRow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  addRow(obj: LodgingRow) {
    const dateEl = this.shadowRoot?.querySelector('#date');
    const locationEl = this.shadowRoot?.querySelector('#location');
    const maxRateEl = this.shadowRoot?.querySelector('#max-rate');
    const amountEl = this.shadowRoot?.querySelector<HTMLInputElement>('#amount');

    if (!(dateEl && locationEl && maxRateEl && amountEl)) return;

    const { date, location, maxRate } = obj;

    dateEl.textContent = date;
    locationEl.textContent = location;
    maxRateEl.textContent = maxRate.toString();
    amountEl.value = maxRate.toFixed(2);
    amountEl.setAttribute('max', maxRate.toString());
  }
}
