import pdcLocationRow from './location-row';
customElements.define('pdc-location-row', pdcLocationRow);

const template = document.createElement('template');

template.innerHTML = /* HTML */ `
  <h3>Date and Location</h3>
  <p>Enter the location of your trip. For multiple locations, use the + add another button</p>
  <div data-pdc="location-rows">
    <pdc-location-row></pdc-location-row>
  </div>
  <button data-pdc="add-row">+Add</button>
`;

export default class pdcLocationContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const btn = this.shadowRoot?.querySelector('[data-pdc="add-row"');
    if (!(btn instanceof HTMLButtonElement)) return;
    btn.addEventListener('click', () => {
      this.addRow();
    });
  }

  addRow() {
    const div = this.shadowRoot?.querySelector('[data-pdc="location-rows"');
    const rows = this.shadowRoot?.querySelectorAll('pdc-location-row');
    if (!(div instanceof HTMLDivElement && rows instanceof NodeList && rows.length > 0)) return;
    div.insertAdjacentHTML('beforeend', '<pdc-location-row></pdc-location-row>');
  }
}
