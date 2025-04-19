import { LocationFromList } from '../config';

const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <input list="states" autocomplete="off" data-pdc="location-state" />
  <datalist id="states"></datalist>
`;

export default class PdcLocationState extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  set options(arr: LocationFromList[]) {
    // delete previously created datalists and create one with new options
    if (this.shadowRoot) this.shadowRoot.innerHTML = '';
    this.shadowRoot?.appendChild(template.content.cloneNode(true));

    const datalist = this.shadowRoot?.querySelector('datalist');
    if (!datalist) return;

    arr.forEach(listItem => {
      const option = document.createElement('option');
      option.setAttribute('value', listItem.label);
      option.setAttribute('label', listItem.label);
      option.setAttribute('data-pdc-state', listItem.abbreviation);
      option.innerHTML = listItem.label;
      datalist.appendChild(option);
    });

    const input = this.shadowRoot?.querySelector('input');
    if (input)
      input.addEventListener('change', () => {
        const val = arr.find(listItem => listItem.label === input.value);
        if (val?.abbreviation) this.setAttribute('state', val.abbreviation);
      });
  }
}
