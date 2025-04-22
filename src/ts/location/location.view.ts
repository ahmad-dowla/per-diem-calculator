import type {
  DateRaw,
  LocationFromList,
  LocationCities,
  LocationRow,
  LocationForAPI,
  LocationCategory,
} from '../config';

import { isDateRawType, isLocationCategory } from '../config';

import PdcLocationDates from './location-date';
import PdcLocationCategory from './location-category';
import PdcLocationState from './location-state';
import PdcLocationCity from './location-city';

customElements.define('pdc-location-dates', PdcLocationDates);
customElements.define('pdc-location-category', PdcLocationCategory);
customElements.define('pdc-location-state', PdcLocationState);
customElements.define('pdc-location-city', PdcLocationCity);

const formatDateString = (dateVal: string, dayOffset: number | null = null) => {
  const date = new Date(dateVal);
  if (dayOffset) date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
};

const renderHTML = /* HTML */ `
  <div data-pdc="location-container">
    <h3>Date and Location</h3>
    <p>
      Enter the location of your trip. For multiple locations, use the + add another
      button
    </p>
    <div data-pdc="location-rows"></div>
    <button type="button" data-pdc="location-add">+Add</button>
    <span data-pdc="location-add-error-message"></span>
    <hr />

    <div data-pdc="location-expense-category">
      <span>I need to calculate:</span>
      <label>
        <input type="radio" name="pdc-location-expense-category" value="lodging" />
        <span>lodging per diem</span>
      </label>
      <label>
        <input type="radio" name="pdc-location-expense-category" value="meals" />
        <span>meals and incidentals per diem</span>
      </label>
      <label>
        <input
          type="radio"
          name="pdc-location-expense-category"
          value="both"
          checked="true"
        />
        <span>both</span>
      </label>
    </div>

    <button type="button" data-pdc="location-generate">Generate Expenses</button>
  </div>
`;

export default class PdcLocationView {
  #container;
  #rowsContainer: Element | null = null;

  constructor(container: HTMLFormElement) {
    this.#container = container;
  }

  render() {
    this.#container.setAttribute('autocomplete', 'off');
    this.#container.insertAdjacentHTML('beforeend', renderHTML);

    this.#rowsContainer = this.#container.querySelector('[data-pdc="location-rows"]');

    this.#addRow();

    this.#container.addEventListener('click', e => {
      const target = e.target;

      if (target instanceof HTMLButtonElement) {
        target.dataset.pdc === 'location-delete' && this.#deleteRow(target);

        target.dataset.pdc === 'location-add' && this.#addRow();

        target.dataset.pdc === 'location-generate' &&
          this.#container.setAttribute('valid', 'false');
      }
    });
  }

  #addRow() {
    /* 
    if rows exist, check to see if last row has a selected end date, reject if it doesn't, and if it does, add the new row with +1 day to the start date
     */
    const lastRow = this.#rowsContainer?.lastElementChild;
    let newStartAttr = null;

    if (lastRow) {
      const lastRowDates = lastRow.querySelector<PdcLocationDates>('pdc-location-dates');
      if (!lastRowDates) return;
      const endAttr = lastRowDates?.getAttribute('end');
      const addRowError = document.querySelector(
        '[data-pdc="location-add-error-message"]',
      );
      if (!addRowError) return;
      if (!endAttr) {
        addRowError.textContent = 'Enter end date of last row before adding new rows';
        return;
      }
      newStartAttr = formatDateString(endAttr, 1);
      lastRowDates.setEndInputDisabled = true;
    }
    // this.#rowsContainer?.insertAdjacentHTML(
    //   'beforeend',
    //   /* HTML */ `
    //     <div data-pdc="location-row">
    //       <pdc-location-dates
    //         ${newStartAttr ? `start="${newStartAttr}"` : 'first'}
    //       ></pdc-location-dates>
    //       <pdc-location-category></pdc-location-category>
    //       <pdc-location-state></pdc-location-state>
    //       <pdc-location-city></pdc-location-city>
    //       <button type="button" data-pdc="location-delete">X</button>
    //     </div>
    //   `,
    // );
    // Default values for testing, delete after
    this.#rowsContainer?.insertAdjacentHTML(
      'beforeend',
      /* HTML */ `
        <div data-pdc="location-row">
          <pdc-location-dates
            start="2025-04-10"
            end="2025-04-20"
            ${newStartAttr ? `start="${newStartAttr}"` : 'first'}
          ></pdc-location-dates>
          <pdc-location-category category="intl"></pdc-location-category>
          <pdc-location-state state="VIRGIN ISLANDS, BRITISH"></pdc-location-state>
          <pdc-location-city city="Virgin Islands, British"></pdc-location-city>
          <button type="button" data-pdc="location-delete">X</button>
        </div>
      `,
    );
  }

  #deleteRow(target: HTMLButtonElement) {
    const row = target.closest('[data-pdc="location-row"]');
    if (!this.#rowsContainer || !row) return;

    // If there is only one row, delete it and immediately add a blank template row
    if (this.#rowsContainer.childElementCount === 1) {
      row.remove();
      this.#addRow();
      return;
    }

    // If the deleted row is first row with a next sibling, remove disabled parameter on next sibling's start date input
    if (!row.previousElementSibling && row.nextElementSibling) {
      const nextRowEndDates =
        row.nextElementSibling.querySelector<PdcLocationDates>('pdc-location-dates');
      if (!nextRowEndDates) return;
      nextRowEndDates.setStartInputDisabled = false;
      nextRowEndDates.setAttribute('first', '');
    }

    // If the deleted row has both a prev and next sibling, make sure next sibling's start date is updated to be 1 day after prev sibling's end date
    if (row.previousElementSibling && row.nextElementSibling) {
      const prevEndDates =
        row.previousElementSibling.querySelector<PdcLocationDates>('pdc-location-dates');
      const nextRowEndDates =
        row.nextElementSibling.querySelector<PdcLocationDates>('pdc-location-dates');
      if (!(prevEndDates && nextRowEndDates)) return;
      const prevEndAttr = prevEndDates?.getAttribute('end');
      if (!prevEndAttr) return;
      const newStartAttr = formatDateString(prevEndAttr, 1);
      nextRowEndDates.setStartInput = newStartAttr;
    }

    // If last row with a prev sibling, make prev sibling's end date input not disabled
    if (row.previousElementSibling && !row.nextElementSibling) {
      const prevEndDates =
        row.previousElementSibling.querySelector<PdcLocationDates>('pdc-location-dates');
      if (!prevEndDates) return;
      prevEndDates.setEndInputDisabled = false;
    }

    row.remove();
    return;
  }

  #observer(attr: string, controllerHandler: Function, viewFunction: Function) {
    const callback = (mutations: MutationRecord[]) => {
      mutations.forEach(mutation => {
        if (mutation.type !== 'attributes' || mutation.attributeName !== attr) {
          return;
        }
        const target = mutation.target;
        if (!(target instanceof HTMLElement)) return;
        const result = viewFunction(target, mutation.attributeName);
        controllerHandler(result);
      });
    };
    const observer = new MutationObserver(callback);
    if (this.#container)
      observer.observe(this.#container, {
        subtree: true,
        attributeFilter: [attr],
      });
  }

  handlerRowCategory(controllerHandler: Function) {
    this.#observer('category', controllerHandler, this.#locationRowResult);
  }

  handlerRowState(controllerHandler: Function) {
    this.#observer('state', controllerHandler, this.#locationRowResult);
  }

  hanlderValidate(handler: Function) {
    this.#observer('valid', handler, this.#validateResult);
  }

  #locationRowResult(target: HTMLElement, attrName: string) {
    const row = target.closest<HTMLDivElement>('[data-pdc="location-row"]');
    const dateEl = row?.querySelector('pdc-location-dates');
    const date = dateEl?.getAttribute('end');
    const categoryEl = row?.querySelector('pdc-location-category');
    const category = categoryEl?.getAttribute('category');
    const stateEl = row?.querySelector('pdc-location-state');
    const cityEl = row?.querySelector<PdcLocationCity>('pdc-location-city');

    // If location type has changed from domestic to intl or view versa, delete existing city select elements
    if (attrName === 'category') {
      if (cityEl) cityEl.resetOptions();
    }

    if (
      !(
        row &&
        date &&
        isDateRawType(date) &&
        category &&
        isLocationCategory(category) &&
        stateEl &&
        cityEl
      )
    )
      return;
    const result: LocationRow = {
      category: category,
      state: stateEl.getAttribute('state') || '',
      city: cityEl.getAttribute('city') || '',
      row: row,
      date: date,
    };
    return result;
  }

  setStateOptions(arr: LocationFromList[], row: HTMLElement) {
    const rowState = row.querySelector<PdcLocationState>('pdc-location-state');
    const rowCity = row.querySelector<PdcLocationCity>('pdc-location-city');
    if (rowState) rowState.options = arr;
    rowCity?.removeAttribute('city');
  }

  setCityOptions(arr: LocationCities[], row: HTMLElement, category: LocationCategory) {
    const rowCity = row.querySelector<PdcLocationCity>('pdc-location-city');
    if (rowCity) rowCity[`setOptions${category}`] = arr;
  }

  #validateResult(target: HTMLElement, attrName: string) {
    if (!target.hasAttribute(attrName)) return;
    target.removeAttribute(attrName);

    let valid = false;

    type validator =
      | PdcLocationDates
      | PdcLocationCategory
      | PdcLocationState
      | PdcLocationCity;

    const [...dates] = document.querySelectorAll<validator>('pdc-location-dates');
    const [...categories] = document.querySelectorAll<validator>('pdc-location-category');
    const [...states] = document.querySelectorAll<validator>('pdc-location-state');
    const [...cities] = document.querySelectorAll<validator>('pdc-location-city');
    const validators: validator[] = [...dates, ...categories, ...states, ...cities];

    validators.forEach(row => row.validate());
    const validate = (el: validator) => {
      return el.valid;
    };
    valid = validators.every(validate);

    if (valid) {
      const expensesCategory = document.querySelector<HTMLInputElement>(
        'input[name="pdc-location-expense-category"]:checked',
      )?.value;

      const expenseDatesLocations = dates.reduce(
        (result: LocationForAPI[], dateEl, i) => {
          if (!(dateEl.getAttribute('start') && dateEl.getAttribute('end')))
            return result;

          const date = dateEl.getAttribute('start');
          const end = dateEl.getAttribute('end');
          const category = categories[i].getAttribute('category');
          const state = states[i].getAttribute('state');
          const city = cities[i].getAttribute('city');
          if (
            !(
              date &&
              isDateRawType(date) &&
              end &&
              isDateRawType(end) &&
              category &&
              isLocationCategory(category) &&
              state &&
              city
            )
          )
            return result;

          const addObj = (date: DateRaw) => {
            result.push({ date, category, state, city });
          };

          let start = date;
          while (start && start !== end) {
            addObj(start);
            const newStart = formatDateString(start, 1);
            if (isDateRawType(newStart)) start = newStart;
          }
          addObj(start);
          return result;
        },
        [],
      );

      const result = { expensesCategory, expenseDatesLocations };

      return result;
    }
  }
}
