// Types
import type {
    AllViewLocationsValid,
    Location,
    LocationKeys,
    StateLocationItem,
} from '../../types/locations';
import type { ConfigSectionText } from '../../types/config';

// Utils
import { isDateRawType, getYY, getMM, getDD } from '../../utils/dates';
import { locationKeys } from '../../utils/locations';
import {
    inPrimitiveType,
    handlePointerDown,
    handlePointerUp,
    debounce,
    wait,
} from '../../utils/misc';
import { removeStyles, applyStyles } from '../../utils/styles';
import {
    APPROX_DAYS_IN_6_MONTHS,
    MILLISECONDS_IN_DAY,
    ROW_ANIMATE_MS,
    SCREEN_WIDTH_LG,
    ROW_CLOSED_HEIGHT,
    DEBOUNCE_TIME,
} from '../../utils/config';

// HTML/CSS
import templateHTML from './template.html?raw';
import templateRowHTML from './template-row.html?raw';

// Custom Elements
import {
    PdcLocationCategory,
    PdcLocationSelect,
    PdcLocationDate,
    PdcButton,
} from '../../components';
customElements.define('pdc-location-date', PdcLocationDate);
customElements.define('pdc-location-category', PdcLocationCategory);
customElements.define('pdc-location-select', PdcLocationSelect);
customElements.define('pdc-button', PdcButton);

// Template for this Custom Element
const template = document.createElement('template');
const templateRow = document.createElement('template');

// Custom Element
export class PdcLocationView extends HTMLElement {
    /* INITIAL SETUP
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

    /* EVENTS
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
        const debouncedHandleResize = debounce(this.#windowResize.bind(this));
        window.addEventListener('resize', debouncedHandleResize);
    }

    #handleClicks(e: Event) {
        const target = e.target;
        if (!(target instanceof SVGElement || target instanceof HTMLElement))
            return;

        const btnEl = target.closest('button');
        const btnPdcEl = target.closest<PdcButton>('pdc-button');
        const row = target.closest<HTMLElement>('[data-pdc="location-row"]');
        switch (true) {
            case btnEl?.getAttribute('id') === 'add-row':
                this.#addRow();
                return;
            case btnEl?.dataset.pdc === 'delete-row':
                this.#deleteRow(row);
                return;
            case btnPdcEl?.getAttribute('id') === 'calculate':
                this.#validateRows('calculate');
                return;
            case !!target.closest('[data-pdc="location-row-toggle"]'):
                this.#rowToggle(row);
                return;
            case !!target.closest('#expense-category') &&
                e instanceof KeyboardEvent &&
                target instanceof HTMLLabelElement:
                target.click();
                return;
            case !!target.closest('#error'):
                target.closest('#error')?.classList.remove('active');
                return;
            default:
                return;
        }
    }

    /* GET ELS
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
        const summary = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-summary"]',
        );
        const deleteBtn =
            summary?.parentElement?.querySelector<HTMLButtonElement>(
                'button[data-pdc="delete-row"]',
            );
        const contents = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-contents"]',
        );
        const details = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-details"]',
        );
        if (!(deleteBtn && summary && contents && details))
            throw new Error('Failed to render row summary elements.');
        return {
            deleteBtn,
            summary,
            contents,
            details,
        };
    }

    get #viewBtns() {
        const addRow = this.shadowRoot
            ?.querySelector('#add-row')
            ?.closest('div');
        const expenseCategory =
            this.shadowRoot?.querySelector<HTMLElement>('#expense-category');
        const calculateExpenses = this.shadowRoot
            ?.querySelector('#calculate')
            ?.closest('div');
        if (!(addRow && expenseCategory && calculateExpenses))
            throw new Error('Failed to render buttons for location View.');
        return {
            addRow,
            expenseCategory,
            calculateExpenses,
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

    /* UPDATE METHODS
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

    async #deleteRow(row: HTMLElement | null) {
        if (!row) return;
        if (this.#rowsContainer.childElementCount === 1) {
            this.#errorEl.classList.add('active');
            this.#errorEl.textContent = '1 row required.';
            return;
        }
        const prevRow = row.previousElementSibling;
        const nextRow = row.nextElementSibling;
        await this.#rowToggle(row, 'delete', nextRow);

        // Update date input restrictions for existing rows
        if (prevRow) {
            this.#getRowPdcEls(prevRow).start.restrictStartInput();
            this.#getRowPdcEls(prevRow).end.restrictStartInput();
        }
        if (nextRow) {
            this.#getRowPdcEls(nextRow).start.restrictStartInput();
            this.#getRowPdcEls(nextRow).end.restrictStartInput();
        }

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
        const startDate =
            start ?
                `${getMM(start)}/${getDD(start)}/${getYY(start)}`
            :   '\u00A0';
        const endDate =
            end ? ` to ${getMM(end)}/${getDD(end)}/${getYY(end)}` : '\u00A0';
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
        Object.values(this.#getRowPdcEls(row)).forEach(
            el => el.isEnabled && el.enableTabIndex(enable),
        );
    }

    #disableAllTabIndexes() {
        this.#rows.forEach(row => {
            Object.values(this.#getRowPdcEls(row)).forEach(
                el => el.isEnabled && el.enableTabIndex(false),
                this.#getRowAnimatedEls(row).deleteBtn.setAttribute(
                    'tabindex',
                    '-1',
                ),
            );
        });
        this.#viewBtns.calculateExpenses
            .querySelector<PdcButton>('pdc-button')
            ?.enableTabIndex(false);

        [
            this.#viewBtns.addRow.querySelector('button'),
            ...this.#viewBtns.expenseCategory.querySelectorAll('label'),
        ].forEach(el => el && el.setAttribute('tabindex', '-1'));
    }

    /* VISUAL METHODS
     */

    #clearErrorEl() {
        this.#errorEl.classList.remove('active');
    }

    async #rowToggle(
        row: HTMLElement | null,
        toggle: 'open' | 'close' | 'initial' | 'add' | 'delete' | null = null,
        nextRow: Element | null = null,
    ) {
        if (!row || !this.#styled || row.classList.contains('toggling')) return;
        if (!toggle) {
            const direction =
                (
                    window.innerWidth >= SCREEN_WIDTH_LG ||
                    row.offsetHeight === ROW_CLOSED_HEIGHT
                ) ?
                    'open'
                :   'close';
            this.#rowToggle(row, direction);
            return;
        }
        this.#clearErrorEl();
        row.classList.remove(
            'pdc-row-open',
            'pdc-row-close',
            'pdc-row-initial',
        );
        row.classList.add('toggling', `pdc-row-${toggle}`);
        // Pre-toggle adjustments
        if (toggle === 'initial' || toggle === 'add') {
            this.#styleRow(row);
            this.#returnRowObject(row); // Sets row count
        }
        await wait(0);
        this.#disableAllTabIndexes();

        // Fire toggles
        if (toggle === 'open' || toggle === 'initial' || toggle === 'add') {
            row.style.height =
                this.#getRowAnimatedEls(row).details.offsetHeight + 'px';
            this.#getRowAnimatedEls(row).contents.style.height =
                this.#getRowAnimatedEls(row).details.offsetHeight + 'px';
            await this.#animateRow(row, 'open');
        }
        if (toggle === 'close') {
            await this.#animateRow(row, 'close');
            row.style.height = ROW_CLOSED_HEIGHT + 'px';
            this.#getRowAnimatedEls(row).contents.style.height =
                ROW_CLOSED_HEIGHT + 'px';
        }
        if (toggle === 'delete') {
            row.style.height = 0 + 'px';
            await this.#animateRowDelete(row, nextRow);
        }
        if (toggle !== 'delete') {
            row.classList.remove('ring-transparent');
            row.classList.add('ring-neutral-200');
        }
        if (window.innerWidth >= SCREEN_WIDTH_LG) {
            this.#rows.forEach(row => {
                row
                    .querySelector('[data-pdc="location-row-sidebar"]')
                    ?.querySelector('[data-pdc="delete-row"]')
                    ?.setAttribute('tabindex', '0');
            });
        } else {
            this.#rows.forEach(row => {
                row
                    .querySelector('[data-pdc="location-row-sidebar"]')
                    ?.querySelector('[data-pdc="delete-row"]')
                    ?.setAttribute('tabindex', '-1');
            });
        }
        row.classList.remove('toggling');
        this.#viewBtns.calculateExpenses
            .querySelector<PdcButton>('pdc-button')
            ?.enableTabIndex(true);
        // Activate tabindex for delete icon which is hidden while row open
        [
            this.#getRowAnimatedEls(row).deleteBtn,
            this.#viewBtns.addRow.querySelector('button'),
            ...this.#viewBtns.expenseCategory.querySelectorAll('label'),
        ].forEach(el => el && el.setAttribute('tabindex', '0'));
    }

    async #animateRow(row: HTMLElement, direction: 'open' | 'close') {
        const { details, summary, deleteBtn } = this.#getRowAnimatedEls(row);
        this.#enableRowTabIndex(row, direction === 'open' ? true : false);
        if (direction === 'open') details.removeAttribute('inert');
        else details.setAttribute('inert', '');
        [summary, deleteBtn].forEach(
            el => (el.style.opacity = direction === 'open' ? '0' : '100'),
        );
        details.style.opacity = direction === 'open' ? '100' : '0';
        details.style.transform =
            direction === 'open' ? 'translateX(100%)' : 'translateX(0%)';
        summary.style.transform =
            direction === 'open' ? 'translateY(-200%)' : 'translateY(0%)';
        deleteBtn.style.transform =
            direction === 'open' ? 'translateX(200%)' : 'translateX(0%)';
    }

    async #animateRowDelete(row: HTMLElement, nextRow: Element | null = null) {
        row.classList.remove('ring-neutral-300');
        row.classList.add('ring-transparent');
        await wait(ROW_ANIMATE_MS);
        // Deleted row was only row -> add a blank template row
        row.remove();
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
    }

    #windowResize = () => {
        [...this.#rows].forEach(row => {
            if (
                window.innerWidth < SCREEN_WIDTH_LG &&
                row.offsetHeight === ROW_CLOSED_HEIGHT
            )
                return;
            this.#styleRow(row);
            row.style.height =
                this.#getRowAnimatedEls(row).details.scrollHeight + 'px';
            this.#getRowAnimatedEls(row).contents.style.height =
                this.#getRowAnimatedEls(row).details.scrollHeight + 'px';
            if (window.innerWidth >= SCREEN_WIDTH_LG)
                this.#rowToggle(row, 'open');
        });
    };

    #styleRow = (row: HTMLElement) => {
        const index = this.#getRowIndex(row);
        const color = index % 2 === 0 ? 'neutral-50' : 'white';
        const oppColor = color === 'neutral-50' ? 'white' : 'neutral-50';
        row.classList.remove('bg-white', 'bg-neutral-50');
        row.classList.add(`bg-${color}`);
        row.style.zIndex = index.toString();
        Object.values(this.#getRowPdcEls(row)).forEach((el, i) => {
            if (window.innerWidth < SCREEN_WIDTH_LG)
                el.setAttribute('bg', i % 2 === 0 ? color : oppColor);
            else el.setAttribute('bg', color);
        });
    };

    /* VALIDATION
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

    #validateRows = (calculate: 'calculate' | null = null): boolean => {
        const validators = this.#getValidators();
        this.#valid = validators.every(el => this.#validatePdcEl(el));
        if (this.#valid && calculate) {
            if (!this.#tripIsLessThanSixMos()) {
                this.#errorEl.textContent = 'Trip length must be < 6 months';
                this.#errorEl.classList.add('active');
                this.#valid = false;
                return this.#valid;
            }
            this.#rowsContainer.setAttribute('validate', `${this.#valid}`);
        }
        return this.#valid;
    };

    #tripIsLessThanSixMos() {
        const start = this.#getRowPdcEls(this.#rows[0]).start.pdcValue;
        const end = this.#getRowPdcEls(this.#rows[this.#rows.length - 1]).end
            .pdcValue;
        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const diffInMs = Math.abs(endDate.getTime() - startDate.getTime());
            const days = Math.ceil(diffInMs / MILLISECONDS_IN_DAY);
            if (days > APPROX_DAYS_IN_6_MONTHS) return false;
            else return true;
        }
        return false;
    }

    /* CONTROLLER/VIEW METHODS
     */
    controllerHandler(
        controlUpdateFunction: (
            row: StateLocationItem,
            changedAttr: LocationKeys,
            newValue: string | null,
        ) => void,
        controlDeleteFunction: (updatedRows: StateLocationItem[]) => void,
        controlValidateFunction: (viewValidator: AllViewLocationsValid) => void,
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
        controlUpdateFunction: (
            row: StateLocationItem,
            changedAttr: LocationKeys,
            newValue: string | null,
        ) => void,
        controlDeleteFunction: (updatedRows: StateLocationItem[]) => void,
        controlValidateFunction: (viewValidator: AllViewLocationsValid) => void,
        viewUpdateFunction: (target: Element) => StateLocationItem,
        viewDeleteFunction: () => StateLocationItem[],
        viewValidateFunction: () => AllViewLocationsValid,
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
        const debouncedCallback = debounce(callback);
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
        if (window.innerWidth < SCREEN_WIDTH_LG)
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
        switch (updatedAttr) {
            case 'city':
                if (window.innerWidth < SCREEN_WIDTH_LG) {
                    await wait(DEBOUNCE_TIME);
                    this.#rowToggle(row, 'close');
                }
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
        start.restrictStartInput();
        end.restrictEndInput();
        if (!end.pdcValue) {
            category.enable(false);
            country.enable(false);
            city.enable(false);
        }
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
