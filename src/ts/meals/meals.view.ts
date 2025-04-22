import type { LodgingRow } from '../config';

import PdcMealsRow from './meals-row';

customElements.define('pdc-meals-row', PdcMealsRow);

const renderHTML = /* HTML */ `
  <div data-pdc="meals-container">
    <h3>Meals & Incidentals</h3>
    <p>
      Enter the location of your trip. For multiple locations, use the + add
      another button.
    </p>
    <div data-pdc="meals-rows"></div>
  </div>
`;

export default class PdcMealsView {
  #container;
  #rowsContainer: Element | null = null;

  constructor(container: HTMLFormElement) {
    this.#container = container;
  }

  render() {
    this.#container.setAttribute('autocomplete', 'off');
    this.#container.insertAdjacentHTML('beforeend', renderHTML);
    this.#rowsContainer = this.#container.querySelector(
      '[data-pdc="meals-rows"]',
    );
  }

  addRows(arr: LodgingRow[]) {
    arr.forEach(row => {
      const newRow = document.createElement('pdc-meals-row');
      newRow instanceof PdcMealsRow && newRow.addRow(row);
      this.#rowsContainer &&
        this.#rowsContainer.insertAdjacentElement('beforeend', newRow);
    });
  }
}
