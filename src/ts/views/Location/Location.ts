// Types
import type {
    AllViewLocationsValid,
    Location,
    LocationKeys,
    StateLocationItem,
} from '../../types/locations';
import type { ConfigSectionText } from '../../types/config';

// Utils
import { isDateRawType, getShortDate } from '../../utils/dates';
import { locationKeys } from '../../utils/locations';
import {
    inPrimitiveType,
    handlePointerDown,
    handlePointerUp,
    debounce,
    wait,
} from '../../utils/misc';
import { removeStyles, applyStyles } from '../../utils/styles';

// HTML/CSS
import templateHTML from './template.html?raw';
import templateRowHTML from './template-row.html?raw';

// Custom Elements
import {
    PdcLocationCategory,
    PdcLocationSelect,
    PdcLocationDate,
    PdcButtonText,
    PdcLabel,
} from '../../components';
customElements.define('pdc-location-date', PdcLocationDate);
customElements.define('pdc-location-category', PdcLocationCategory);
customElements.define('pdc-location-select', PdcLocationSelect);
customElements.define('pdc-button-text', PdcButtonText);
customElements.define('pdc-label', PdcLabel);

// Template for this Custom Element
const template = document.createElement('template');
const templateRow = document.createElement('template');

// Custom Element
export class PdcLocationView extends HTMLElement {
    /* Initial setup
     */
    #styled: boolean;
    #valid = false;

    constructor(styled: boolean, config: ConfigSectionText) {
        super();
        this.attachShadow({ mode: 'open' });

        this.#styled = styled;
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.#shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.#shadowRoot.appendChild(template.content.cloneNode(true));

        this.#applyConfig(config);
        this.#createEventListeners();
        this.#addRow('initial');
    }

    #applyConfig = (config: ConfigSectionText) => {
        const heading = this.shadowRoot?.querySelector<HTMLElement>('#heading');
        const body = this.shadowRoot?.querySelector<HTMLElement>('#body');

        if (heading && config.heading) {
            heading.innerHTML = '';
            heading.insertAdjacentHTML('beforeend', config.heading);
        } else heading?.remove();

        if (body && config.body) {
            body.innerHTML = '';
            body.insertAdjacentHTML('beforeend', config.body);
        } else body?.remove();
    };

    /* Events
     */
    #createEventListeners() {
        const viewContainer =
            this.shadowRoot?.querySelector<HTMLElement>('#view-container');

        // Mouse, touch events
        let pointerStartX = 0;
        let pointerStartY = 0;
        viewContainer?.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        viewContainer?.addEventListener('pointerup', e => {
            if (e instanceof PointerEvent) {
                const result = handlePointerUp(
                    e,
                    this.#handleClicks.bind(this),
                    pointerStartX,
                    pointerStartY,
                );
                pointerStartX = result.pointerStartX;
                pointerStartY = result.pointerStartY;
            }
        });

        // Keyboard events
        viewContainer?.addEventListener('keydown', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });

        // Resize events
        const debouncedHandleResize = debounce(
            this.#windowResize.bind(this),
            300,
            // MAGIC 300
        );
        window.addEventListener('resize', debouncedHandleResize);
    }

    #handleClicks(e: Event) {
        const target = e.target;
        if (!(target instanceof SVGElement || target instanceof HTMLElement))
            return;

        const btnEl = target.closest('button');
        const btnPdcEl = target.closest<PdcButtonText>('pdc-button-text');
        const row = target.closest<HTMLElement>('[data-pdc="location-row"]');

        switch (true) {
            case btnEl?.getAttribute('id') === 'add-row':
                this.#addRow();
                return;
            case btnEl?.dataset.pdc === 'delete-row':
                row && this.#deleteRow(row);
                return;
            case btnPdcEl?.getAttribute('id') === 'generate-expenses':
                this.#validateRows('generate');
                return;
            case !!target.closest('[data-pdc="location-row-toggle"]'):
                row && this.#rowToggle(row);
                return;
            case !!target.closest('#error'):
                target.closest('#error')?.classList.remove('active');
                return;
            default:
                return;
        }
    }

    /* Get view elements
     */

    get #rowsContainer() {
        const rowsContainer =
            this.#shadowRoot.querySelector<HTMLElement>('#rows');
        if (!rowsContainer)
            throw new Error(
                'Failed to render rows container for location View.',
            );
        return rowsContainer;
    }

    get #rows() {
        const rows = this.#shadowRoot.querySelectorAll<HTMLElement>(
            '[data-pdc="location-row"]',
        );
        if (!rows)
            throw new Error('Failed to render row elements for location View.');
        return rows;
    }

    #getRowFromIndex(rowIndex: number) {
        const row = this.#rowsContainer.children[rowIndex];
        if (!(row instanceof HTMLElement))
            throw new Error(
                `Failed to get row using row index of ${rowIndex} in Location view.`,
            );
        return row;
    }

    #getRowPdcEls(row: Element) {
        const start = row.querySelector<PdcLocationDate>('[pdc="start"]');
        const end = row.querySelector<PdcLocationDate>('[pdc="end"]');
        const category =
            row.querySelector<PdcLocationCategory>('[pdc="category"]');
        const country = row.querySelector<PdcLocationSelect>('[pdc="country"]');
        const city = row.querySelector<PdcLocationSelect>('[pdc="city"]');
        if (!(start && end && category && country && city))
            throw new Error('Failed to render row custom elements.');
        return {
            start,
            end,
            category,
            country,
            city,
        };
    }

    #getRowAnimatedEls(row: Element) {
        const deleteBtn = row.querySelector<HTMLButtonElement>(
            'button[data-pdc="delete-row"]',
        );
        const summary = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-summary"]',
        );
        const details = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-details"]',
        );
        if (!(deleteBtn && summary && details))
            throw new Error('Failed to render row summary elements.');
        return {
            deleteBtn,
            summary,
            details,
        };
    }

    get #viewBtns() {
        const addRow = this.shadowRoot
            ?.querySelector('#add-row')
            ?.closest('div');
        const expenseCategory =
            this.shadowRoot?.querySelector<HTMLElement>('#expense-category');
        const generateExpenses = this.shadowRoot
            ?.querySelector('#generate-expenses')
            ?.closest('div');
        if (!(addRow && expenseCategory && generateExpenses))
            throw new Error('Failed to render buttons for location View.');
        return {
            addRow,
            expenseCategory,
            generateExpenses,
        };
    }

    get #errorEl() {
        const errorEl = this.#shadowRoot.querySelector('#error');
        if (!errorEl) throw new Error('Failed to render row summary elements.');
        return errorEl;
    }

    get #shadowRoot() {
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for location View.`);
        return this.shadowRoot;
    }

    #getRowIndex(row: Element) {
        if (!row.parentNode)
            throw new Error(`Failed to get row index in Location View.`);
        return Array.from(
            row.parentNode.querySelectorAll('[data-pdc="location-row"]'),
        ).indexOf(row);
    }

    /* Update methods
     */

    #addRow(initial: 'initial' | null = null) {
        if (!this.#validateRows()) return; // Validate before adding rows
        templateRow.innerHTML =
            this.#styled ? templateRowHTML : removeStyles(templateRowHTML);
        this.#rowsContainer.appendChild(templateRow.content.cloneNode(true));
        const newRow = this.#rowsContainer.lastElementChild;
        if (!(newRow instanceof HTMLElement))
            throw new Error('Failed to render new row');
        this.#rowToggle(newRow, initial ? initial : 'add');
    }

    async #deleteRow(row: HTMLElement) {
        if (this.#rowsContainer.childElementCount === 1) {
            this.#errorEl.classList.add('active');
            this.#errorEl.textContent = '1 row required.';
            return;
        }
        const prevRow = row.previousElementSibling;
        const nextRow = row.nextElementSibling;
        await this.#rowToggle(row, 'delete', nextRow);

        // Update date input restrictions for existing rows
        prevRow && this.#getRowPdcEls(prevRow).start.restrictStartInput();
        prevRow && this.#getRowPdcEls(prevRow).end.restrictStartInput();
        nextRow && this.#getRowPdcEls(nextRow).start.restrictStartInput();
        nextRow && this.#getRowPdcEls(nextRow).end.restrictStartInput();

        // Trigger #observer to update state
        this.#rowsContainer.setAttribute('update-state', `true`);
    }

    #updateRowSummary(location: StateLocationItem): void {
        const { index, start, end, country, city } = location;
        const row = this.#getRowFromIndex(index);

        const rowNumberEl = row.querySelector(
            '[data-pdc="location-row-number"]',
        );
        const rowSummaryDatesEl = row.querySelector(
            '[data-pdc="location-row-summary-dates"]',
        );
        const rowSummaryLocationEl = row.querySelector(
            '[data-pdc="location-row-summary-countrycity"]',
        );
        if (!(rowNumberEl && rowSummaryDatesEl && rowSummaryLocationEl))
            throw new Error('Failed to render row summary elements.');

        const rowCount = (index + 1).toString().padStart(2, '0');
        const startDate = start ? getShortDate(start) : '\u00A0';
        const endDate = end ? ` to ${getShortDate(end)}` : '\u00A0';
        const countryCity = city && country ? `${city} (${country})` : '\u00A0';

        rowNumberEl.textContent = rowCount;
        rowSummaryDatesEl.textContent = startDate + endDate;
        rowSummaryLocationEl.textContent = countryCity;
    }

    createOptions(
        rowIndex: number,
        arr: Location[],
        locationCategory: Extract<LocationKeys, 'country' | 'city'>,
    ) {
        const row = this.#getRowFromIndex(rowIndex);
        const rowSelect = row.querySelector<PdcLocationSelect>(
            `[pdc="${locationCategory}"]`,
        );
        rowSelect?.setOptions(arr);
    }

    #enableRowTabIndex(row: Element, enable: boolean) {
        // Disable tab index for row's PdcEls
        Object.values(this.#getRowPdcEls(row)).forEach(el =>
            el.enableTabIndex(enable),
        );
        // Activate tabindex for delete icon which is hidden while row open
        this.#getRowAnimatedEls(row).deleteBtn.setAttribute(
            'tabindex',
            enable ? '-1' : '0',
        );
    }

    /* Visual methods
     */

    #clearErrorEl() {
        this.#errorEl.classList.remove('active');
    }

    #rowToggle = async (
        row: HTMLElement,
        toggle: 'open' | 'close' | 'add' | 'initial' | 'delete' | null = null,
        nextRow: Element | null = null,
    ) => {
        if (!this.#styled || row.classList.contains('toggling')) return;
        // MAGIC 96
        if (!toggle) {
            this.#rowToggle(row, row.offsetHeight === 96 ? 'open' : 'close');
            return;
        }
        row.classList.remove(
            'pdc-row-open',
            'pdc-row-initial',
            'pdc-row-add',
            'pdc-row-close',
        );
        row.classList.add('toggling', `pdc-row-${toggle}`);
        // Pre-toggle adjustments
        if (toggle === 'close' || toggle === 'delete') this.#clearErrorEl();
        if (toggle === 'open') this.#animateBtns('open');
        if (toggle === 'add' || toggle === 'initial') {
            if (this.#rowsContainer.childElementCount > 1 && toggle === 'add')
                this.#animateBtns('open'); // Trigger animation only if there are existing rows
            this.#styleRow(row);
            this.#returnRowObject(row); // Sets row count
        }
        // Fire toggles
        if (toggle === 'open' || toggle === 'add' || toggle === 'initial')
            await this.#animateRow(row, 'open');
        if (toggle === 'close') await this.#animateRow(row, 'close');
        if (toggle === 'delete') await this.#animateRowDelete(row, nextRow);
        if (toggle !== 'delete') {
            row.classList.remove('ring-transparent');
            row.classList.add('ring-neutral-200');
        }
        row.classList.remove('toggling');
    };

    #animateRow = async (row: HTMLElement, direction: 'open' | 'close') => {
        // MAGIC 750
        await wait(750);
        this.#enableRowTabIndex(row, direction === 'open' ? true : false);
        row.style.height = `${direction === 'open' ? row.scrollHeight : row.clientHeight}px`;
        const { details, summary, deleteBtn } = this.#getRowAnimatedEls(row);
        [summary, deleteBtn].forEach(
            el => (el.style.opacity = direction === 'open' ? '0' : '100'),
        );
        details.style.opacity = direction === 'open' ? '100' : '0';
        details.style.transform =
            direction === 'open' ? 'translateX(100%)' : `translateX(0%)`;
        summary.style.transform =
            direction === 'open' ? 'translateY(-200%)' : `translateY(0%)`;
        deleteBtn.style.transform =
            direction === 'open' ? 'translateX(200%)' : `translateX(0%)`;
        if (direction === 'close') this.#animateBtns();
    };

    #animateRowDelete = async (
        row: HTMLElement,
        nextRow: Element | null = null,
    ) => {
        row.classList.remove('ring-neutral-300');
        row.classList.add('ring-transparent');
        // MAGIC 800
        await wait(800);
        // Deleted row was only row -> add a blank template row
        row.remove();
        this.#animateBtns();
        if (nextRow) {
            // For any next rows
            const index = this.#getRowIndex(nextRow);
            [...this.#rows]
                .filter((_, i) => i >= index)
                .map(remainingRow => {
                    this.#returnRowObject(remainingRow); // Update summary number
                    this.#styleRow(remainingRow); // Update background color
                });
        }
    };

    async #animateBtns(open: 'open' | null = null) {
        const btns = [
            this.#viewBtns.addRow,
            this.#viewBtns.expenseCategory,
            this.#viewBtns.generateExpenses,
        ];
        const rowsOpen =
            !!open ||
            [...this.#rows].some(
                // MAGIC 96
                row => row.offsetHeight !== 96,
            );
        btns.forEach(btn =>
            btn.classList.remove(rowsOpen ? 'rows-closed' : 'rows-open'),
        );
        btns.forEach(btn =>
            btn.classList.add(rowsOpen ? 'rows-open' : 'rows-closed'),
        );
        // MAGIC 450
        await wait(450);
        btns.forEach(btn => (btn.style.zIndex = rowsOpen ? '0' : '50'));
        if (rowsOpen) {
            this.#viewBtns.addRow.style.transform = `translateY(-100%)`;
            this.#viewBtns.expenseCategory.style.transform = `translateY(400%)`;
            this.#viewBtns.generateExpenses.style.transform = `translateY(200%)`;
        } else {
            btns.forEach(btn => (btn.style.transform = `translateY(0%)`));
        }
    }

    #windowResize = () => {
        [...this.#rows].forEach(row => {
            if (row.offsetHeight === 96) return;
            row.style.height =
                this.#getRowAnimatedEls(row).details.scrollHeight + 'px';
        });
    };

    #styleRow = (row: HTMLElement) => {
        const index = this.#getRowIndex(row);
        const color = index % 2 === 0 ? 'neutral-50' : 'white';
        const oppColor = color === 'neutral-50' ? 'white' : 'neutral-50';
        row.classList.remove('bg-white', 'bg-neutral-50');
        row.classList.add(`bg-${color}`);
        row.style.zIndex = index.toString();
        [...this.#getRowAnimatedEls(row).details.children].forEach((el, i) => {
            el.setAttribute('bg', i % 2 === 0 ? color : oppColor);
        });
    };

    showLoadingSpinner(
        rowIndex: number,
        enabled: boolean,
        locationCategory: Extract<LocationKeys, 'country' | 'city'>,
    ) {
        if (!this.#styled) return;
        const row = this.#getRowFromIndex(rowIndex);
        row
            .querySelector<PdcLocationSelect>(`[pdc='${locationCategory}']`)
            ?.showLoadingSpinner(enabled);
    }

    /* Validation
     */
    #getValidators = (): (
        | PdcLocationDate
        | PdcLocationCategory
        | PdcLocationSelect
    )[] => {
        const dates =
            this.#rowsContainer.querySelectorAll<PdcLocationDate>(
                'pdc-location-date',
            );
        const categories =
            this.#rowsContainer.querySelectorAll<PdcLocationCategory>(
                'pdc-location-category',
            );
        const selects = this.#rowsContainer.querySelectorAll<PdcLocationSelect>(
            'pdc-location-select',
        );
        return [...dates, ...categories, ...selects];
    };

    #validatePdcEl = (
        pdcEl: PdcLocationDate | PdcLocationCategory | PdcLocationSelect,
    ): boolean => {
        if (!pdcEl.validate()) {
            const row = pdcEl.closest<HTMLElement>('[data-pdc="location-row"]');
            if (row?.classList.contains('pdc-row-close'))
                this.#rowToggle(row, 'open');
        }
        return pdcEl.validate();
    };

    #validateRows = (generate: 'generate' | null = null): boolean => {
        const validators = this.#getValidators();
        this.#valid = validators.every(el => this.#validatePdcEl(el));
        if (generate === 'generate')
            this.#rowsContainer.setAttribute('validate', `${this.#valid}`);
        return this.#valid;
    };

    /* Controller / View interaction
     */
    controllerHandler(
        controlUpdateFunction: Function,
        controlDeleteFunction: Function,
        controlValidateFunction: Function,
    ) {
        this.#observer(
            controlUpdateFunction,
            controlDeleteFunction,
            controlValidateFunction,
            this.#returnRowObject,
            this.#returnAllRowsOjbect,
            this.#returnValidation,
        );
    }

    #observer(
        controlUpdateFunction: Function,
        controlDeleteFunction: Function,
        controlValidateFunction: Function,
        viewUpdateFunction: Function,
        viewDeleteFunction: Function,
        viewValidateFunction: Function,
    ) {
        const callback = (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                const changedAttr = mutation.attributeName;
                if (!(changedAttr && mutation.target instanceof Element))
                    return;
                const target = mutation.target;
                const newValue = target.getAttribute(changedAttr);
                if (changedAttr === 'validate' && !!newValue) {
                    const result = viewValidateFunction();
                    controlValidateFunction(result);
                    return;
                }
                if (changedAttr === 'update-state' && !!newValue) {
                    const result = viewDeleteFunction();
                    controlDeleteFunction(result);
                    return;
                }
                if (inPrimitiveType<LocationKeys>(locationKeys, changedAttr)) {
                    const result = viewUpdateFunction(target);
                    controlUpdateFunction(result, changedAttr, newValue);
                    return;
                }
                return;
            });
        };
        const debouncedCallback = debounce(callback, 300);
        const observer = new MutationObserver(debouncedCallback);
        if (this.shadowRoot)
            observer.observe(this.shadowRoot, {
                subtree: true,
                attributeFilter: ['update-state', 'validate', ...locationKeys],
            });
    }

    #returnRowObject = (target: Element): StateLocationItem => {
        const row = target.closest('[data-pdc="location-row"]');
        if (!row) throw new Error('Failed to get row.');
        const getPdcValue = <
            T extends PdcLocationDate | PdcLocationCategory | PdcLocationSelect,
        >(
            tag: LocationKeys,
        ) => {
            return row.querySelector<T>(`[pdc="${tag}"]`)?.pdcValue;
        };
        const index = this.#getRowIndex(row);
        const start = getPdcValue<PdcLocationDate>('start');
        const end = getPdcValue<PdcLocationDate>('end');
        const category = getPdcValue<PdcLocationCategory>('category');
        const country = getPdcValue<PdcLocationSelect>('country');
        const city = getPdcValue<PdcLocationSelect>('city');

        const result: StateLocationItem = {
            index,
            ...(start && isDateRawType(start) && { start }),
            ...(end && isDateRawType(end) && { end }),
            ...((category === 'domestic' || category === 'intl') && {
                category,
            }),
            ...(country && { country }),
            ...(city && { city }),
        };
        this.#updateRowSummary(result);
        return result;
    };

    #returnAllRowsOjbect = (): StateLocationItem[] => {
        const result = [...this.#rows].map(row => {
            return this.#returnRowObject(row);
        });
        this.removeAttribute('update-state');
        return result;
    };

    #returnValidation = (): AllViewLocationsValid => {
        this.removeAttribute('validate');
        this.#rows.forEach(row => this.#rowToggle(row, 'close'));
        const inputValue = this.shadowRoot?.querySelector<HTMLInputElement>(
            'input[name="expenses-category"]:checked',
        )?.value;
        const expensesCategory =
            inputValue === 'mie' || inputValue === 'lodging' ?
                inputValue
            :   'both';
        return {
            valid: this.#valid,
            expensesCategory,
        };
    };

    async restrictRow(index: number, updatedAttr: LocationKeys) {
        const row = this.#getRowFromIndex(index);
        // MAGIC 250
        switch (updatedAttr) {
            case 'city':
                await wait(250);
                this.#rowToggle(row, 'close');
                return;
            case 'country':
                this.#getRowPdcEls(row).city.enable(true);
                return;
            case 'category':
                this.#restrictCategory(row);
                return;
            case 'end':
                this.#restrictEnd(row);
                return;
            case 'start':
                this.#restrictStart(row);
                return;
        }
    }

    #restrictStart(row: Element): void {
        const { start, end, category, country, city } = this.#getRowPdcEls(row);
        category.enable(false);
        country.enable(false);
        city.enable(false);
        start.restrictStartInput();
        end.restrictEndInput();
    }

    #restrictEnd(row: Element): void {
        const { start, end, category, country, city } = this.#getRowPdcEls(row);
        country.enable(false);
        city.enable(false);
        start.restrictStartInput();
        end.restrictEndInput();
        category.enable(true);
    }

    #restrictCategory(row: Element) {
        const { country, city } = this.#getRowPdcEls(row);
        city.enable(false);
        country.enable(true);
    }
}
