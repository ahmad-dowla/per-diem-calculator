const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <label>
    <input type="radio" name="pdc-location-category" value="domestic" />
    <span>Contiguous U.S.</span>
  </label>
  <p>(48 contiguous states and the District of Columbia)</p>
  <label>
    <input type="radio" name="pdc-location-category" value="intl" />
    <span>Outside Continguous U.S.</span>
  </label>
  <p>Other countries, Alaska, Hawaii, and U.S. territories</p>
  <span>In location for OCON, enter Alaska, Hawaii instead of country</span>
  <span id="error-message"></span>
`;

export default class PdcLocationCategory extends HTMLElement {
  #valid: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));

    this.addEventListener('click', e => {
      const target = e.composedPath()[0];
      target instanceof HTMLInputElement &&
        this.setAttribute('category', target.value);
    });
  }

  validate() {
    const error = this.shadowRoot?.querySelector('#error-message');
    if (!error) return false;
    error.textContent = '';

    if (this.hasAttribute('category')) {
      this.#valid = true;
      return;
    }

    error.textContent = 'Category must be selected';
  }

  get valid() {
    return this.#valid;
  }
}
