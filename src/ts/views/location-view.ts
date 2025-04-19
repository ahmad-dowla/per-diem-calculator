import { LocationFromList, LocationFromFetch, handlerResult } from '../config';

import PdcLocationDates from '../components/location-date';
import PdcLocationCategory from '../components/location-category';
import PdcLocationState from '../components/location-state';
import PdcLocationCity from '../components/location-city';

customElements.define('pdc-location-dates', PdcLocationDates);
customElements.define('pdc-location-category', PdcLocationCategory);
customElements.define('pdc-location-state', PdcLocationState);
customElements.define('pdc-location-city', PdcLocationCity);

export default class PdcLocationView {
  container;
  rows: Element | null = null;

  constructor(container: HTMLFormElement) {
    this.container = container;
  }

  render() {
    this.container.setAttribute('autocomplete', 'off');
    this.container.innerHTML = /* HTML */ `
      <h3>Date and Location</h3>
      <p>
        Enter the location of your trip. For multiple locations, use the + add another
        button
      </p>
      <div data-pdc="location-rows"></div>
      <button type="button" data-pdc="add-row">+Add</button>
    `;

    this.rows = this.container.querySelector('[data-pdc="location-rows"]');

    this.#addRow();

    this.container.addEventListener('click', e => {
      const target = e.target;

      // delete row button
      target instanceof HTMLButtonElement &&
        target.dataset.pdc === 'location-delete' &&
        this.#deleteRow(target);

      // add row button
      target instanceof HTMLButtonElement &&
        target.dataset.pdc === 'add-row' &&
        this.#addRow();
    });
  }

  #addRow() {
    this.rows?.insertAdjacentHTML(
      'beforeend',
      /* HTML */ `
        <div data-pdc="location-row">
          <pdc-location-dates></pdc-location-dates>
          <pdc-location-category></pdc-location-category>
          <pdc-location-state></pdc-location-state>
          <pdc-location-city></pdc-location-city>
          <button type="button" data-pdc="location-delete">X</button>
        </div>
      `,
    );
  }

  #deleteRow(target: HTMLButtonElement) {
    const row = target.closest('[data-pdc="location-row"]');
    if (this.rows && this.rows.childElementCount > 1) row?.remove();
  }

  #attrMutationCallback(attr: string, handler: Function) {
    const callback = (mutations: MutationRecord[]) => {
      mutations.forEach(mutation => {
        if (mutation.type !== 'attributes' || mutation.attributeName !== attr) {
          return;
        }
        const target = mutation.target;
        if (!(target instanceof HTMLElement)) return;

        const row = target.closest('[data-pdc="location-row"]');
        const categoryEl = row?.querySelector('pdc-location-category');
        const category = categoryEl?.getAttribute('category');
        const stateEl = row?.querySelector('pdc-location-state');
        const cityEl = row?.querySelector('pdc-location-city');

        if (mutation.attributeName === 'category') {
          if (cityEl instanceof PdcLocationCity) cityEl.emptyOptions();
        }

        if (
          !(
            row instanceof HTMLElement &&
            (category === 'domestic' || category === 'intl') &&
            stateEl &&
            cityEl
          )
        )
          return;
        const result: handlerResult = {
          category: category,
          state: stateEl.getAttribute('state') || '',
          city: cityEl.getAttribute('city') || '',
          row: row,
        };
        handler(result);
      });
    };
    return callback;
  }

  #listener(attr: string, handler: Function) {
    const observerHandler = (result: handlerResult) => {
      handler(result);
    };
    const observer = new MutationObserver(
      this.#attrMutationCallback(attr, observerHandler),
    );
    if (this.rows)
      observer.observe(this.rows, {
        subtree: true,
        attributeFilter: [attr],
      });
    handler(observer);
  }

  handlerRowCategory(handler: Function) {
    this.#listener('category', handler);
  }

  setStateOptions(arr: LocationFromList[], row: HTMLElement) {
    const rowState = row.querySelector('pdc-location-state');
    if (rowState instanceof PdcLocationState) {
      rowState.options = arr;
    }
  }

  handlerRowState(handler: Function) {
    this.#listener('state', handler);
  }

  setCityOptions(arr: LocationFromFetch[], row: HTMLElement) {
    const rowCity = row.querySelector('pdc-location-city');
    if (rowCity instanceof PdcLocationCity) {
      rowCity.options = arr;
    }
  }
}
