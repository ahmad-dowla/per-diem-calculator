const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <label>
    <input
      type="radio"
      data-pdc="location-category"
      name="pdc-location-category"
      value="domestic"
    />
    <span>Contiguous U.S.</span>
  </label>
  <p>(48 contiguous states and the District of Columbia)</p>
  <label>
    <input
      type="radio"
      data-pdc="location-category"
      name="pdc-location-category"
      value="intl"
    />
    <span>Outside Continguous U.S.</span>
  </label>
  <p>Other countries, Alaska, Hawaii, and U.S. territories</p>
  <span>In location for OCON, enter Alaska, Hawaii instead of country</span>
`;

export default class PdcLocationCategory extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));

    this.addEventListener('click', e => {
      const target = e.composedPath()[0];

      if (target instanceof HTMLInputElement) {
        this.category = target.value;
      }
    });
  }

  set category(val: string) {
    this.setAttribute('category', val);
  }

  get category() {
    const category = this.getAttribute('category');
    if (!category) return 'not-set';
    return category;
  }
}
