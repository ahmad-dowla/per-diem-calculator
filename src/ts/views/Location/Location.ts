// TODO Add row
// TODO delete row
// TODO dates updatnig with add/delete
// TODO error message when click add/generate
// TODO validation

// Types
import type {
    Location,
    LocationKeys,
    StateLocationItem,
} from '../../types/locations';
import type { ConfigSectionText } from '../../types/config';
import { DateRaw } from '../../types/dates';

// Utils
import { isDateRawType, getShortDate } from '../../utils/dates';
import { locationKeys } from '../../utils/locations';
import {
    inPrimitiveType,
    handlePointerDown,
    handlePointerUp,
    debounce,
} from '../../utils/misc';
import { removeStyles, applyStyles } from '../../utils/styles';

// HTML/CSS
import templateHTML from './template.html?raw';
import templateRowHTML from './template-row.html?raw';

// Custom Elements
import { PdcLocationCategory } from '../../components';
import { PdcLocationSelect } from '../../components';
import { PdcLocationDate } from '../../components';

customElements.define('pdc-location-date', PdcLocationDate);
customElements.define('pdc-location-category', PdcLocationCategory);
customElements.define('pdc-location-select', PdcLocationSelect);

// Template for this Custom Element
const template = document.createElement('template');
const templateRow = document.createElement('template');

// Custom Element
export class PdcLocationView extends HTMLElement {
    #rowsContainer: HTMLElement | null;
    #styled: boolean;
    #valid = false;
    #expensesCategory: string = '';

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.#rowsContainer = null;
        this.#styled = false;
    }

    render(styled: boolean, config: ConfigSectionText) {
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for location View.`);
        if (this.shadowRoot !== null) this.shadowRoot.innerHTML = '';

        this.#styled = styled;
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Selectors to plugin any custom text provided to config
        const heading = this.shadowRoot.querySelector<HTMLElement>('#heading');
        const body = this.shadowRoot.querySelector<HTMLElement>('#body');
        this.#rowsContainer =
            this.shadowRoot.querySelector<HTMLElement>('#rows');

        if (!(heading && body && this.#rowsContainer))
            throw new Error('Failed to render elements for location View.');

        if (config.heading) {
            heading.innerHTML = '';
            heading.insertAdjacentHTML('beforeend', config.heading);
        } else heading.remove();

        if (config.body) {
            body.innerHTML = '';
            body.insertAdjacentHTML('beforeend', config.body);
        } else body.remove();

        this.#addRow('initial');

        // Event listeners for the delete location, add location, and generate expenses buttons
        let pointerStartX = 0;
        let pointerStartY = 0;
        this.shadowRoot.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        this.shadowRoot.addEventListener('pointerup', e => {
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
    }

    renderLoadingSpinner(rowIndex: number, enabled: boolean) {
        if (!this.#styled) return;
        const row = this.#getRowFromIndex(rowIndex);
        const spinner = row.querySelector('[data-pdc="loading-spinner"]');
        if (!spinner)
            throw new Error(
                `Failed to get loading spinner element for rowIndex ${rowIndex} in Location view.`,
            );
        enabled ?
            spinner.classList.add('active')
        :   spinner.classList.remove('active');
    }

    #handleClicks(e: Event) {
        const target = e.target;

        if (!(target instanceof SVGElement || target instanceof HTMLElement))
            return;
        const btn = target.closest('button');
        const row = target.closest<HTMLElement>('[data-pdc="location-row"]');
        switch (true) {
            case !!target.closest('#error'):
                const errorContainer = target.closest('#error');
                errorContainer?.classList.remove('active');
                return;
            case btn?.dataset.pdc === 'location-delete':
                row && this.#deleteRow(row);
                return;
            case btn?.getAttribute('id') === 'add-row':
                this.#validateRows() && this.#addRow();
                return;
            case btn?.getAttribute('id') === 'generate-expenses':
                this.#validateRows() &&
                    this.#rowsContainer?.setAttribute('validate', '');
                return;
            case !!row && !!target.closest('[data-pdc="location-row-summary"]'):
                this.#toggleRow(row);
                return;
            default:
                return;
        }
    }

    #addRow(initial: 'initial' | null = null) {
        const totalRowCount = this.#rowsContainer?.childElementCount;
        const newRowCount = totalRowCount ? totalRowCount + 1 : 1;
        const rowId = Date.now();

        let newRowMarkup =
            this.#styled ? templateRowHTML : removeStyles(templateRowHTML);
        newRowMarkup = newRowMarkup
            .replace('PDC_ROW_COUNT', newRowCount.toString().padStart(2, '0'))
            .replaceAll('ROW_ID', rowId.toString())
            .replaceAll('PDC_HEIGHT', initial ? '' : 'h-0');
        templateRow.innerHTML = newRowMarkup;
        this.#rowsContainer?.appendChild(templateRow.content.cloneNode(true));
        const newRow = this.#rowsContainer?.lastElementChild;
        if (!(newRow instanceof HTMLElement))
            throw new Error(`Failed to render new row.`);
        const newRowObject = this.#returnRowObject(newRow);
        this.#updateRowSummary(newRowObject);
        this.#toggleRow(newRow, 'new');
    }

    #deleteRow(row: HTMLElement) {
        this.#toggleRow(row, 'delete');

        const prevRow = row.previousElementSibling;
        const nextRow = row.nextElementSibling;
        setTimeout(() => {
            row.remove();

            // Update restrictions on date inputs for both previously last row and new row
            const restrictDateInputs = (row: Element): void => {
                const start =
                    row.querySelector<PdcLocationDate>('[pdc="start"]');
                const end = row.querySelector<PdcLocationDate>('[pdc="end"]');
                start?.restrictStartInput();
                end?.restrictEndInput();
            };
            prevRow && restrictDateInputs(prevRow);
            nextRow && restrictDateInputs(nextRow);

            // Update attribute to trigger listener that updates state
            this.#rowsContainer?.setAttribute('update-state', `true`);
            // Deleted row was only row -> add a blank template row
            this.#rowsContainer?.childElementCount === 0 && this.#addRow();

            if (nextRow) {
                const index = this.#getRowIndex(nextRow);
                const rows = this.#rowsContainer?.querySelectorAll(
                    '[data-pdc="location-row"]',
                );
                if (!rows)
                    throw new Error(
                        'Failed to get row parent container when deleting row.',
                    );
                [...rows]
                    .filter((_, i) => i >= index)
                    .map(remainingRow => {
                        const rowObj = this.#returnRowObject(remainingRow);
                        this.#updateRowSummary(rowObj);
                    });
            }
        }, 750);
        return;
    }

    #getRowIndex(row: Element) {
        console.log(row, row.parentNode);
        if (!row || !row.parentNode)
            throw new Error(`Failed to get row index in Location View.`);
        return Array.from(
            row.parentNode.querySelectorAll('[data-pdc="location-row"]'),
        ).indexOf(row);
    }

    #getRowFromIndex(rowIndex: number) {
        const row = this.#rowsContainer?.children[rowIndex];
        if (!(row instanceof HTMLElement))
            throw new Error(
                `Failed to get row using row index of ${rowIndex} in Location view.`,
            );
        return row;
    }

    // Get all of a row's Pdc elements
    #getRowEls(row: Element) {
        const startEl = row.querySelector<PdcLocationDate>('[pdc="start"]');
        const endEl = row.querySelector<PdcLocationDate>('[pdc="end"]');
        const categoryEl =
            row.querySelector<PdcLocationCategory>('[pdc="category"]');
        const countryEl =
            row.querySelector<PdcLocationSelect>('[pdc="country"]');
        const cityEl = row.querySelector<PdcLocationSelect>('[pdc="city"]');
        const switchToDatesBtn = row.querySelector<HTMLInputElement>(
            'input[id^="pdc-el-date"]',
        );
        const switchToCategoryBtn = row.querySelector<HTMLInputElement>(
            'input[id^="pdc-el-category"]',
        );
        const switchToCountryCityBtn = row.querySelector<HTMLInputElement>(
            'input[id^="pdc-el-countrycity"]',
        );
        const rowSummaryNumberEl = row.querySelector('h3');
        const rowSummaryDatesEl = row.querySelector('h4');
        const rowSummaryLocationEl = row.querySelector('h5');
        return {
            startEl,
            endEl,
            categoryEl,
            countryEl,
            cityEl,
            switchToDatesBtn,
            switchToCategoryBtn,
            switchToCountryCityBtn,
            rowSummaryNumberEl,
            rowSummaryDatesEl,
            rowSummaryLocationEl,
        };
    }

    setOptions(
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

    // handlerDeleteRow(controllerHandler: Function) {
    //     this.#observer(
    //         'update-state',
    //         controllerHandler,
    //         this.#locationRowDeleteResult.bind(this),
    //     );
    // }
    // handlerValidate(controllerHandler: Function) {
    //     this.#observer(
    //         'validate',
    //         controllerHandler,
    //         this.#validRowsResult.bind(this),
    //     );
    // }

    #toggleRow(
        row: HTMLElement,
        toggle: 'open' | 'closed' | 'new' | 'delete' | null = null,
        first: boolean | null = null,
    ): void {
        if (!this.#styled) return;
        const rowDetails = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-details"]',
        );
        const rowSummary = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-summary"]',
        );
        const rowSpacer = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-spacer"]',
        );
        if (!(rowDetails && rowSummary && rowSpacer))
            throw new Error(`Failed to render row elements in Location view.`);
        setTimeout(() => {
            const targetHeightSummary =
                rowSummary.clientHeight === 56 ? 80 : 56;
            const targetHeightDetails =
                !rowDetails.clientHeight ? rowDetails.scrollHeight : 0;
            const targetHeightSpacer = !rowSpacer.clientHeight ? 32 : 0;
            switch (toggle) {
                case 'open':
                    row.classList.add('pdc-row-open');
                    rowSummary.style.height = rowSummary.scrollHeight + 'px';
                    rowDetails.style.height = rowDetails.scrollHeight + 'px';
                    row.style.height =
                        rowSummary.scrollHeight +
                        rowDetails.scrollHeight +
                        rowSpacer.scrollHeight +
                        2 +
                        'px';
                    return;
                case 'closed':
                    row.classList.remove('pdc-row-open');
                    rowSummary.style.height = 56 + 'px';
                    rowDetails.style.height = 0 + 'px';
                    row.style.height = rowSummary.scrollHeight + 2 + 'px';
                    return;
                case 'new':
                    rowSummary.style.height = rowSummary.scrollHeight + 'px';
                    rowDetails.style.height = rowDetails.scrollHeight + 'px';
                    row.style.height =
                        rowSummary.scrollHeight +
                        rowDetails.scrollHeight +
                        rowSpacer.scrollHeight +
                        2 +
                        'px';
                    setTimeout(() => {
                        row.removeAttribute('inert');
                    }, 500);
                    return;
                case 'delete':
                    row.setAttribute('inert', '');
                    row.classList.remove('active');
                    row.style.height = 0 + 'px';
                    return;
                default:
                    row.classList.toggle('pdc-row-open');
                    rowSummary.style.height = targetHeightSummary + 'px';
                    rowDetails.style.height = targetHeightDetails + 'px';
                    row.style.height =
                        targetHeightSummary +
                        targetHeightDetails +
                        targetHeightSpacer +
                        2 +
                        'px';
                    return;
            }
        }, 0);
    }

    transitionRow(index: number, updatedAttr: LocationKeys): void {
        if (!this.#styled) return; // No transitions in unstyled config
        // Switch between input pages/row opening based on current row values
        const row = this.#getRowFromIndex(index);
        const { cityEl } = this.#getRowEls(row);
        switch (updatedAttr) {
            case 'city':
                setTimeout(() => {
                    this.#toggleRow(row, 'closed');
                }, 250);
                return;
            case 'country':
                cityEl?.enable(true);
                return;
            case 'category':
                this.#transitionCategory(row);
                return;
            case 'end':
                this.#transitionEnd(row);
                return;
            case 'start':
                this.#transitionStart(row);
                return;
        }
    }

    #transitionStart(row: Element): void {
        const { startEl, endEl, categoryEl, countryEl, cityEl } =
            this.#getRowEls(row);
        startEl?.restrictStartInput();
        endEl?.restrictEndInput();
        categoryEl?.enableCategory(false);
        countryEl?.enable(false);
        cityEl?.enable(false);
        endEl?.focusInput();
    }

    #transitionEnd(row: Element): void {
        const {
            startEl,
            endEl,
            categoryEl,
            countryEl,
            cityEl,
            switchToCategoryBtn,
        } = this.#getRowEls(row);
        startEl?.restrictStartInput();
        endEl?.restrictEndInput();
        categoryEl?.enableCategory(true);
        countryEl?.enable(false);
        cityEl?.enable(false);
        setTimeout(() => switchToCategoryBtn?.click(), 300);
    }

    #transitionCategory(row: Element) {
        const { countryEl, cityEl, switchToCountryCityBtn } =
            this.#getRowEls(row);
        countryEl?.enable(true);
        cityEl?.enable(false);
        setTimeout(() => {
            switchToCountryCityBtn?.click();
        }, 300);
    }

    #returnRowObject = (row: Element): StateLocationItem => {
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

        return {
            index,
            ...(start && isDateRawType(start) && { start }),
            ...(end && isDateRawType(end) && { end }),
            ...((category === 'domestic' || category === 'intl') && {
                category,
            }),
            ...(country && { country }),
            ...(city && { city }),
        };
    };

    // #locationRowDeleteResult(target: Element, _: string) {
    //     const updatedRows: StateLocationItem[] = [];
    //     [...target.children].forEach(row => {
    //         const result = this.#locationRowUpdateResult(row);
    //         result && updatedRows.push(result);
    //     });
    //     return updatedRows;
    // }

    // #validRowsResult(_: Element, __: string) {
    //     this.#rowsContainer?.removeAttribute('validate');
    //     return {
    //         valid: this.#valid,
    //         expensesCategory: this.#expensesCategory,
    //     };
    // }

    #updateRowSummary(location: StateLocationItem): void {
        const { index, start, end, country, city } = location;
        const row = this.#getRowFromIndex(index);

        // Get elements
        const { rowSummaryNumberEl, rowSummaryDatesEl, rowSummaryLocationEl } =
            this.#getRowEls(row);
        if (!(rowSummaryNumberEl && rowSummaryDatesEl && rowSummaryLocationEl))
            throw new Error(
                `Failed to render summary elements in location row ${index + 1}.`,
            );

        // Get values
        const rowCount = (index + 1).toString().padStart(2, '0');
        const startDate = start ? getShortDate(start) : '\u00A0';
        const endDate = end ? ` to ${getShortDate(end)}` : '\u00A0';
        const countryCity = city && country ? `${city} (${country})` : '\u00A0';

        // Update els with values
        rowSummaryNumberEl.textContent = rowCount;
        rowSummaryDatesEl.textContent = startDate + endDate;
        rowSummaryLocationEl.textContent = countryCity;
    }

    #getValidators() {
        if (!this.shadowRoot)
            throw new Error('Failed to render ShadowRoot for location View.');

        const dates =
            this.shadowRoot.querySelectorAll<PdcLocationDate>(
                'pdc-location-date',
            );
        const selects = this.shadowRoot.querySelectorAll<PdcLocationSelect>(
            'pdc-location-select',
        );
        const categories =
            this.shadowRoot.querySelectorAll<PdcLocationCategory>(
                'pdc-location-category',
            );

        return [...dates, ...selects, ...categories];
    }

    #validateEl(
        el: PdcLocationDate | PdcLocationCategory | PdcLocationSelect,
    ): boolean {
        const valid = el.validate();
        if (!valid) {
            const row = el.closest<HTMLElement>('[data-pdc="location-row"]');
            if (!row) throw new Error('Failed to get row during validation.');
            const {
                switchToDatesBtn,
                switchToCategoryBtn,
                switchToCountryCityBtn,
            } = this.#getRowEls(row);

            if (el instanceof PdcLocationDate) switchToDatesBtn?.click();
            if (el instanceof PdcLocationCategory) switchToCategoryBtn?.click();
            if (el instanceof PdcLocationSelect)
                switchToCountryCityBtn?.click();

            this.#toggleRow(row, 'open');
        }
        return valid;
    }

    #validateRows() {
        this.#valid = false;
        const validators = this.#getValidators();
        this.#valid = validators.every(el => this.#validateEl(el));

        const expensesCategoryInput =
            this.shadowRoot?.querySelector<HTMLInputElement>(
                'input[name="expenses-category"]:checked',
            );
        if (!expensesCategoryInput)
            throw new Error(
                'Failed to get expense category type from location View.',
            );
        this.#expensesCategory = expensesCategoryInput.value;
        return this.#valid;
    }

    #observer(controllerFunction: Function, viewFunction: Function) {
        const callback = (mutations: MutationRecord[]) => {
            mutations.forEach(mutation => {
                const changedAttr = mutation.attributeName;
                if (!inPrimitiveType<LocationKeys>(locationKeys, changedAttr))
                    return;
                const target = mutation.target;
                if (!(target instanceof Element)) return;
                const newValue = target.getAttribute(changedAttr);
                const row = target.closest<Element>(
                    '[data-pdc="location-row"]',
                );
                const result = viewFunction(row);
                this.#updateRowSummary(result);
                controllerFunction(result, changedAttr, newValue);
            });
        };
        const debouncedCallback = debounce(callback, 300);
        const observer = new MutationObserver(debouncedCallback);
        if (this.shadowRoot)
            observer.observe(this.shadowRoot, {
                subtree: true,
                attributeFilter: [...locationKeys],
            });
    }

    handlerUpdate(controllerFunction: Function) {
        this.#observer(controllerFunction, this.#returnRowObject);
    }
}

customElements.define('pdc-location-view', PdcLocationView);
