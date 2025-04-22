import type { LodgingRow } from '../config';

import PdcLodgingRow from './lodging-row';
customElements.define('pdc-lodging-row', PdcLodgingRow);

const template = document.createElement('template');

template.innerHTML = /* HTML */ `
  <div data-pdc="lodging-container">
    <h3>Lodging</h3>
    <p>
      Enter the location of your trip. For multiple locations, use the + add another
      button.
    </p>
    <div data-pdc="lodging-rows"></div>
  </div>
`;

template.innerHTML = /* HTML */ `
  <div data-pdc="lodging-container">
    <h3>Lodging</h3>
    <p>
      Enter the location of your trip. For multiple locations, use the + add another
      button.
    </p>
    <div data-pdc="lodging-rows"></div>
  </div>
`;

export default class PdcLodgingView {
  #container;
  #rowsContainer: Element | null = null;

  constructor(container: HTMLFormElement) {
    this.#container = container;
  }

  render() {
    this.#container.setAttribute('autocomplete', 'off');
    this.#container.appendChild(template.content.cloneNode(true));
    this.#rowsContainer = this.#container.querySelector('[data-pdc="lodging-rows"]');
  }

  addRows(arr: LodgingRow[]) {
    arr.forEach(row => {
      const newRow = document.createElement('pdc-lodging-row');
      newRow instanceof PdcLodgingRow && newRow.addRow(row);
      this.#rowsContainer &&
        this.#rowsContainer.insertAdjacentElement('beforeend', newRow);
    });
  }
}
