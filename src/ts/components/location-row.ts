import autocomplete from 'autocompleter';
import { LocationFromList, ListStates, ListCountries } from '../lists';

type LocationFromFetch = {
  City: string;
  State: string;
};

const getResults = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to get API results from ${url}.`);
  const result = await res.json();
  return result;
};

const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <div data-pdc="location-dates">
    <label>
      Start
      <input type="date" data-pdc="start-date" />
    </label>
    <label>
      End
      <input type="date" data-pdc="end-date" readonly />
    </label>
  </div>
  <div data-pdc="location-type">
    <input type="radio" name="pdc-location-type" value="domestic" />
    <label for="pdc-location-domestic">Contiguous U.S.</label>
    <p>(48 contiguous states and the District of Columbia)</p>

    <input type="radio" name="pdc-location-type" value="intl" />
    <label for="pdc-location-intl">Outside Continguous U.S.</label>
    <p>Other countries, Alaska, Hawaii, and U.S. territories</p>
    In location for OCON, enter Alaska, Hawaii instead of country
  </div>
  <div data-pdc="location-city"></div>
  <button data-pdc="location-delete">X</button>
`;

export default class pdcLocationRow extends HTMLElement {
  datesDiv;
  typeDiv;
  cityDiv;
  deleteBtn;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
    this.datesDiv = this.el('dates');
    this.typeDiv = this.el('type');
    this.cityDiv = this.el('city');
    this.deleteBtn = this.el('delete');
  }

  el(string: 'dates' | 'type' | 'city' | 'delete') {
    const el = this.shadowRoot?.querySelector(`[data-pdc="location-${string}"]`);
    return el;
  }

  connectedCallback() {
    this.checkPreviousRow();

    if (!(this.typeDiv instanceof HTMLDivElement)) return;
    this.typeDiv.addEventListener('click', e => {
      this.createCityInputs(e);
    });

    if (!(this.deleteBtn instanceof HTMLButtonElement)) return;
    this.deleteBtn.addEventListener('click', () => {
      this.parentElement?.removeChild(this);
    });
  }

  checkPreviousRow() {
    const rows = this.parentElement?.querySelectorAll('pdc-location-row');
    const prevSibling = this.previousElementSibling;
    if (!(rows && prevSibling)) return;
    const prevEnd = prevSibling.querySelector('[data-pdc="end-date"]');
  }

  createCityInputs(e: Event) {
    const target = e.target;
    if (
      !(
        target instanceof HTMLInputElement &&
        (target.value === 'domestic' || target.value === 'intl') &&
        this.cityDiv instanceof HTMLDivElement
      )
    )
      return;

    // Empty value of divSelect to eliminate any previously generated autocompletes/listeners, and then create new inputs
    this.cityDiv.innerHTML = '';
    this.createCityTextInput(target.value);
    this.createCitySelectInput();
  }

  // Create input, attach autocomplete, append to div
  createCityTextInput(category: 'domestic' | 'intl') {
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('autocomplete', 'off');
    const list: LocationFromList[] = category === 'domestic' ? ListStates : ListCountries;
    this.addCityAutoComplete(input, list);
    if (!(this.cityDiv instanceof HTMLDivElement)) return;
    this.cityDiv.appendChild(input);
  }

  addCityAutoComplete(input: HTMLInputElement, list: LocationFromList[]) {
    // Async function to plugin to autocomplete's onSelect method
    const onSelect = async (item: LocationFromList) => {
      input.value = item.label;
      const select = input.closest('div')?.querySelector('select');
      if (!(select instanceof HTMLSelectElement)) return;
      const category = item.category === 'states' ? 'domestic' : 'intl';
      const options = await this.createCityOptions(item.abbreviation, category);
      if (!options) return;
      select.innerHTML = options;
    };

    autocomplete<LocationFromList>({
      input: input,
      emptyMsg: 'No options found',
      minLength: 2,
      fetch: (text: string, update: (items: LocationFromList[]) => void) => {
        const textLower = text.toLowerCase();
        const suggestions = list.filter(item => item.label.toLowerCase().includes(textLower));
        update(suggestions);
      },
      onSelect: onSelect,
    });
  }

  // Create select dropdown, append to div
  createCitySelectInput() {
    const select = document.createElement('select');
    select.setAttribute('id', 'perDiemCalc-location-0');
    if (!(this.cityDiv instanceof HTMLDivElement)) return;
    this.cityDiv.appendChild(select);
  }

  async createCityOptions(filter: string, category: 'domestic' | 'intl') {
    const url =
      category === 'domestic' ?
        'https://api.gsa.gov/travel/perdiem/v2/rates/conus/lodging/2025?api_key=4CYBZhljv7xr8EzHPfcZEWriMgvTJulbBzK6tPgT'
      : '/OCONUSrates/2024.json';
    const data: LocationFromFetch[] = await getResults(url);

    if (category === 'domestic') return this.cityDomesticOptions(data, filter);
    if (category === 'intl') return this.cityIntlOptions(data, filter);
  }

  newOption(rate: LocationFromFetch) {
    const { City: city, State: state } = rate;
    return /* HTML */ ` <option value="${city}, ${state}" data-city="${city}" data-abbr="${state}">
      ${city}
    </option>`;
  }

  cityDomesticOptions(data: LocationFromFetch[], filter: string) {
    let options = '';
    let filteredData: LocationFromFetch[] = [];

    filteredData = data.filter(
      rate => rate.State !== null && rate.State.toLowerCase() === filter.toLowerCase(),
    );
    filteredData
      .filter(rate => rate.City === 'Standard Rate')
      .forEach(rate => (options += this.newOption(rate)));
    filteredData
      .filter(rate => rate.City !== 'Standard Rate')
      .sort((a, b) => a.City.localeCompare(b.City))
      .forEach(rate => (options += this.newOption(rate)));

    return options;
  }

  cityIntlOptions(data: LocationFromFetch[], filter: string) {
    let options = '';
    let filteredData: LocationFromFetch[] = [];

    filteredData = data.filter(
      (rate, index, array) =>
        rate.State.toLowerCase() === filter.toLowerCase() &&
        rate.City.toLowerCase() !== array[index - 1].City.toLowerCase(),
    );
    filteredData
      .sort((a, b) => a.City.localeCompare(b.City))
      .forEach(rate => (options += this.newOption(rate)));

    return options;
  }
}
