const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <label>
    Start
    <input type="date" data-pdc="start-date" />
  </label>
  <label>
    End
    <input type="date" data-pdc="end-date" />
  </label>
`;

export default class PdcLocationDates extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));
  }
}
