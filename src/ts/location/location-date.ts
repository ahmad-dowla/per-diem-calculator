const template = document.createElement('template');
template.innerHTML = /* HTML */ `
  <label>
    Start
    <input type="date" id="start-date" />
    <span id="start-date-error-message"></span>
  </label>
  <label>
    End
    <input disabled type="date" id="end-date" />
    <span id="end-date-error-message"></span>
  </label>
`;

export default class PdcLocationDates extends HTMLElement {
  static observedAttributes = ['start', 'end'];

  #startInput;
  #endInput;
  #startAttr;
  #endAttr;
  #valid: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot?.appendChild(template.content.cloneNode(true));

    this.#startInput =
      this.shadowRoot?.querySelector<HTMLInputElement>('#start-date');
    this.#endInput =
      this.shadowRoot?.querySelector<HTMLInputElement>('#end-date');
    this.#startAttr = this.getAttribute('start');
    this.#endAttr = this.getAttribute('end');

    // if element's "start" attribute set by View's add row function, add the value to the start input and disable the input
    if (this.#startAttr && this.#startInput) {
      this.setStartInput = this.#startAttr;
      this.#startInput.disabled = true;
    }

    // listeners for inputs
    this.shadowRoot?.addEventListener('change', e => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement)) return;

      if (target.id === 'start-date') {
        this.setAttribute('start', target.value);
        this.setStartInput = target.value;
      }

      if (target.id === 'end-date') {
        this.setAttribute('end', target.value);
        this.#startInput && this.#startInput.setAttribute('max', target.value);
      }
    });
  }

  attributeChangedCallback(name: 'start' | 'end', _: string, newValue: string) {
    if (name === 'start') this.#startAttr = newValue;
    if (name === 'end') this.#endAttr = newValue;
  }

  set setStartInput(val: string) {
    if (
      !(
        this.#startInput instanceof HTMLInputElement &&
        this.#endInput instanceof HTMLInputElement
      )
    )
      return;
    this.#startInput.value = val;
    if (!this.hasAttribute('first')) this.#startInput.setAttribute('min', val);
    this.#endInput.setAttribute('min', val);
    if (!this.#endInput.value) this.#endInput.disabled = false;
  }

  set setStartInputDisabled(val: boolean) {
    if (this.#startInput) {
      this.#startInput.disabled = val;
      !val && this.#startInput.removeAttribute('min');
    }
  }

  set setEndInputDisabled(val: boolean) {
    if (this.#endInput) {
      this.#endInput.disabled = val;
      val && this.#endInput.setAttribute('max', this.#endInput.value);
    }
  }

  validate() {
    const startError = this.shadowRoot?.querySelector(
      '#start-date-error-message',
    );
    const endError = this.shadowRoot?.querySelector('#end-date-error-message');
    if (!startError || !endError) return false;
    startError.textContent = '';
    endError.textContent = '';

    if (
      this.#startAttr &&
      this.#endAttr &&
      Date.parse(this.#endAttr) < Date.parse(this.#startAttr)
    )
      startError.textContent = 'Start Date must be older than End Date.';
    if (!this.#endAttr) endError.textContent = 'End Date must be filled.';
    if (!this.#startAttr) startError.textContent = 'Start Date must be filled.';

    const nextRow = this.closest('div')?.nextElementSibling;
    if (nextRow) {
      const nextDatesEl = nextRow.querySelector('pdc-location-dates');
      const nextStartAttr = nextDatesEl?.getAttribute('start');
      if (
        this.#endAttr &&
        nextStartAttr &&
        Date.parse(this.#endAttr) >= Date.parse(nextStartAttr)
      ) {
        endError.textContent = `End Date must be less than next row's Start Date`;
      }
    }

    if (startError.textContent === '' && endError.textContent === '')
      this.#valid = true;
  }

  get valid() {
    return this.#valid;
  }
}
