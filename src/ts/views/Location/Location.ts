// Types
import type {
    AllViewLocationsValid,
    Location,
    LocationKeys,
    StateLocationItem,
} from '../../types/locations';

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
import {
    PdcLocationCategory,
    PdcLocationSelect,
    PdcLocationDate,
    PdcButtonText,
} from '../../components';
customElements.define('pdc-location-date', PdcLocationDate);
customElements.define('pdc-location-category', PdcLocationCategory);
customElements.define('pdc-location-select', PdcLocationSelect);
customElements.define('pdc-button-text', PdcButtonText);

// Template for this Custom Element
const template = document.createElement('template');
const templateRow = document.createElement('template');

// Custom Element
export class PdcLocationView extends HTMLElement {
    #styled: boolean;
    #valid = false;

    constructor(styled: boolean) {
        super();
        this.attachShadow({ mode: 'open' });
        if (!this.shadowRoot)
            throw new Error(`Failed to render ShadowRoot for location View.`);

        this.#styled = styled;
        if (this.#styled) {
            template.innerHTML = templateHTML;
            applyStyles(this.shadowRoot);
        } else template.innerHTML = removeStyles(templateHTML);
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.#addRow('initial');

        /* Event listeners
         */
        const { rowsContainer, viewContainer } = this.#getViewEls();

        // Mouse, touch events
        let pointerStartX = 0;
        let pointerStartY = 0;
        viewContainer.addEventListener('pointerdown', e => {
            if (!(e instanceof PointerEvent)) return;
            const result = handlePointerDown(e);
            pointerStartX = result.pointerStartX;
            pointerStartY = result.pointerStartY;
        });
        viewContainer.addEventListener('pointerup', e => {
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
        viewContainer.addEventListener('keyup', e => {
            if (!(e.key === 'Enter' || e.key === ' ')) return;
            this.#handleClicks(e);
        });

        // Focus events
        viewContainer.addEventListener('focusin', e => {
            this.#handleFocus(e);
        });

        // Resize events
        const handleResize = () => {
            const rows = rowsContainer?.querySelectorAll<HTMLElement>(
                '[data-pdc="location-row"]',
            );
            rows?.forEach(row => {
                this.#rowToggle(row, 'resize');
            });
        };
        const debouncedHandleResize = debounce(handleResize, 300);
        window.addEventListener('resize', debouncedHandleResize);
    }

    /* Event handlers
     */

    #handleFocus(e: Event) {
        const target = e.target;
        if (!(target instanceof SVGElement || target instanceof HTMLElement))
            return;
        const row = target.closest('[data-pdc="location-row"]');
        if (!row) return;
        const pdc = target.dataset.pdc;
        if (pdc === 'switchToDates') {
            this.#rowSwitchToDates(row);
            return;
        }
        if (pdc === 'switchToCategory0' || pdc === 'switchToCategory1') {
            this.#rowSwitchToCategory(row, pdc);
            return;
        }
        if (pdc === 'switchToCountryCity') {
            this.#rowSwitchToCountryCity(row);
            return;
        }
    }

    #handleClicks(e: Event) {
        const target = e.target;

        if (!(target instanceof SVGElement || target instanceof HTMLElement))
            return;
        const btn = target.closest('button');
        const btnText = target.closest<PdcButtonText>('pdc-button-text');
        const row = target.closest<HTMLElement>('[data-pdc="location-row"]');
        const label = target.closest<HTMLLabelElement>('.group\\/label');
        const { rowsContainer } = this.#getViewEls();

        switch (true) {
            case !!target.closest('#error'):
                const errorContainer = target.closest('#error');
                errorContainer?.classList.remove('active');
                return;
            case btn?.dataset.pdc === 'location-delete':
                row && this.#deleteRow(row);
                return;
            case btnText?.getAttribute('id') === 'add-row':
                this.#validateRows() && this.#addRow();
                return;
            case btnText?.getAttribute('id') === 'generate-expenses':
                this.#validateRows() &&
                    rowsContainer.setAttribute('validate', 'true');
                return;
            case !!label:
                const labelFor = label.getAttribute('for');
                if (labelFor?.includes('pdc-el-date'))
                    row && this.#rowSwitchToDates(row);
                if (labelFor?.includes('pdc-el-category'))
                    row && this.#rowSwitchToCategory(row, 'switchToCategory0');
                if (labelFor?.includes('pdc-el-countrycity'))
                    row && this.#rowSwitchToCountryCity(row);
                return;
            case !!row && !!target.closest('[data-pdc="location-row-summary"]'):
                if (!row.classList.contains('toggling')) this.#rowToggle(row);
                return;
            default:
                return;
        }
    }

    /* Get view and row elements
     */

    #getViewEls = () => {
        const rowsContainer =
            this.shadowRoot?.querySelector<HTMLElement>('#rows');
        const viewContainer = this.shadowRoot?.querySelector<HTMLElement>(
            '#location-container',
        );
        if (!(rowsContainer && viewContainer))
            throw new Error('Failed to render elements for location View.');
        return { rowsContainer, viewContainer };
    };

    #getRowIndex(row: Element) {
        if (!row || !row.parentNode)
            throw new Error(`Failed to get row index in Location View.`);
        return Array.from(
            row.parentNode.querySelectorAll('[data-pdc="location-row"]'),
        ).indexOf(row);
    }

    #getRowFromIndex(rowIndex: number) {
        const { rowsContainer } = this.#getViewEls();
        const row = rowsContainer.children[rowIndex];
        if (!(row instanceof HTMLElement))
            throw new Error(
                `Failed to get row using row index of ${rowIndex} in Location view.`,
            );
        return row;
    }

    #getRowPdcEls(row: Element) {
        const startEl = row.querySelector<PdcLocationDate>('[pdc="start"]');
        const endEl = row.querySelector<PdcLocationDate>('[pdc="end"]');
        const categoryEl =
            row.querySelector<PdcLocationCategory>('[pdc="category"]');
        const countryEl =
            row.querySelector<PdcLocationSelect>('[pdc="country"]');
        const cityEl = row.querySelector<PdcLocationSelect>('[pdc="city"]');
        if (!(startEl && endEl && categoryEl && countryEl && cityEl))
            throw new Error('Failed to render row elements.');
        return {
            startEl,
            endEl,
            categoryEl,
            countryEl,
            cityEl,
        };
    }

    #getRowFocusEls(row: Element) {
        const switchToDatesFocus = row.querySelector<HTMLInputElement>(
            '[data-pdc="switchToDates"]',
        );
        const switchToCategory0Focus = row.querySelector<HTMLInputElement>(
            '[data-pdc="switchToCategory0"]',
        );
        const switchToCategory1Focus = row.querySelector<HTMLInputElement>(
            '[data-pdc="switchToCategory1"]',
        );
        const switchToCountryCityFocus = row.querySelector<HTMLInputElement>(
            '[data-pdc="switchToCountryCity"]',
        );
        if (
            !(
                switchToDatesFocus &&
                switchToCategory0Focus &&
                switchToCategory1Focus &&
                switchToCountryCityFocus
            )
        )
            throw new Error('Failed to render row focus elements.');
        return {
            switchToDatesFocus,
            switchToCategory0Focus,
            switchToCategory1Focus,
            switchToCountryCityFocus,
        };
    }

    #getRowSwitcherEls(row: Element) {
        const switchToDatesBtn = row.querySelector<HTMLInputElement>(
            'input[id^="pdc-el-date"]',
        );
        const switchToCategoryBtn = row.querySelector<HTMLInputElement>(
            'input[id^="pdc-el-category"]',
        );
        const switchToCountryCityBtn = row.querySelector<HTMLInputElement>(
            'input[id^="pdc-el-countrycity"]',
        );
        const rowNavLabels =
            row.querySelectorAll<HTMLLabelElement>('.group\\/label');
        if (
            !(
                switchToDatesBtn &&
                switchToCategoryBtn &&
                switchToCountryCityBtn &&
                rowNavLabels
            )
        )
            throw new Error('Failed to render row switch button elements.');
        return {
            switchToDatesBtn,
            switchToCategoryBtn,
            switchToCountryCityBtn,
            rowNavLabels,
        };
    }

    #getRowSummaryEls(row: Element) {
        const rowSummaryNumberEl = row.querySelector('h3');
        const rowSummaryDatesEl = row.querySelector('h4');
        const rowSummaryLocationEl = row.querySelector('h5');
        const rowDetails = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-details"]',
        );
        const rowSummary = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-summary"]',
        );
        if (
            !(
                rowSummaryNumberEl &&
                rowSummaryDatesEl &&
                rowSummaryLocationEl &&
                rowDetails &&
                rowSummary
            )
        )
            throw new Error('Failed to render row summary elements.');
        return {
            rowSummaryNumberEl,
            rowSummaryDatesEl,
            rowSummaryLocationEl,
            rowDetails,
            rowSummary,
        };
    }

    /* Row data methods incl. add, delete, update summary
     */

    #addRow(initial: 'initial' | null = null) {
        const { rowsContainer } = this.#getViewEls();
        const totalRowCount = rowsContainer.childElementCount;
        const newRowCount = totalRowCount ? totalRowCount + 1 : 1;
        const rowId = Date.now();

        let newRowMarkup =
            this.#styled ? templateRowHTML : removeStyles(templateRowHTML);
        newRowMarkup = newRowMarkup
            .replace('PDC_ROW_COUNT', newRowCount.toString().padStart(2, '0'))
            .replaceAll('ROW_ID', rowId.toString())
            .replaceAll('PDC_HEIGHT', initial ? '' : 'h-0');
        templateRow.innerHTML = newRowMarkup;
        rowsContainer.appendChild(templateRow.content.cloneNode(true));
        const newRow = rowsContainer.lastElementChild;
        if (!(newRow instanceof HTMLElement))
            throw new Error(`Failed to render new row.`);
        this.#returnRowObject(newRow); // Calling this will update row summary
        this.#rowToggle(newRow, 'open');
        setTimeout(() => {
            newRow.removeAttribute('inert');
        }, 500);
    }

    #deleteRow(row: HTMLElement) {
        this.#rowToggle(row, 'delete');
        const { rowsContainer } = this.#getViewEls();
        const prevRow = row.previousElementSibling;
        const nextRow = row.nextElementSibling;

        setTimeout(() => {
            // Slight delay to allow for element's transitions
            row.remove();

            // Update restrictions on date inputs for both previously last row and new row
            prevRow
                ?.querySelector<PdcLocationDate>('[pdc="start"]')
                ?.restrictStartInput();
            prevRow
                ?.querySelector<PdcLocationDate>('[pdc="end"]')
                ?.restrictEndInput();
            nextRow
                ?.querySelector<PdcLocationDate>('[pdc="start"]')
                ?.restrictStartInput();
            nextRow?.querySelector<PdcLocationDate>('[pdc="end"]')
                ?.restrictEndInput;

            // Update attribute to trigger listener that updates state
            rowsContainer.setAttribute('update-state', `true`);
            // Deleted row was only row -> add a blank template row
            rowsContainer.childElementCount === 0 && this.#addRow();

            // For any next rows, update summary number
            if (nextRow) {
                const index = this.#getRowIndex(nextRow);
                const rows = rowsContainer.querySelectorAll(
                    '[data-pdc="location-row"]',
                );
                if (!rows)
                    throw new Error(
                        'Failed to get row parent container when deleting row.',
                    );
                [...rows]
                    .filter((_, i) => i >= index)
                    .map(remainingRow => {
                        this.#returnRowObject(remainingRow);
                    });
            }
        }, 750);
        return;
    }

    #updateRowSummary(location: StateLocationItem): void {
        const { index, start, end, country, city } = location;
        const row = this.#getRowFromIndex(index);
        // Get elements
        const { rowSummaryNumberEl, rowSummaryDatesEl, rowSummaryLocationEl } =
            this.#getRowSummaryEls(row);
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

    /* Row navigation methods rows incl. toggle, switch input page
     */

    #rowToggle = (
        row: HTMLElement,
        toggle: 'open' | 'close' | 'new' | 'delete' | 'resize' | null = null,
        validate: 'validate' | null = null,
    ): void => {
        if (!this.#styled) return;
        const { rowDetails, rowSummary } = this.#getRowSummaryEls(row);
        const { startEl, endEl, categoryEl, countryEl, cityEl } =
            this.#getRowPdcEls(row);
        const { rowNavLabels, switchToDatesBtn } = this.#getRowSwitcherEls(row);
        const {
            switchToDatesFocus,
            switchToCategory0Focus,
            switchToCategory1Focus,
            switchToCountryCityFocus,
        } = this.#getRowFocusEls(row);
        row.classList.add('toggling');
        setTimeout(() => {
            switch (toggle) {
                case 'open':
                    row.classList.add('pdc-row-open');
                    rowSummary.style.height = 56 + 'px';
                    rowDetails.style.height = rowDetails.scrollHeight + 'px';
                    row.style.height = 56 + rowDetails.scrollHeight + 34 + 'px';
                    [startEl, endEl, categoryEl, countryEl, cityEl].forEach(
                        el => el.enableTabIndex(el.isEnabled),
                    );
                    rowNavLabels.forEach(el =>
                        el.setAttribute('tabindex', '0'),
                    );
                    [
                        switchToDatesFocus,
                        switchToCategory1Focus,
                        switchToCountryCityFocus,
                    ].forEach(focus => focus.setAttribute('tabindex', '-1'));
                    switchToCategory0Focus.setAttribute(
                        'tabindex',
                        endEl.pdcValue ? '0' : '-1',
                    );
                    return;
                case 'close':
                    row.classList.remove('pdc-row-open');
                    rowSummary.style.height = 80 + 'px';
                    rowDetails.style.height = 0 + 'px';
                    row.style.height = 80 + 34 + 'px';
                    [startEl, endEl, categoryEl, countryEl, cityEl].forEach(
                        el => el.enableTabIndex(false),
                    );
                    [
                        switchToDatesFocus,
                        switchToCategory0Focus,
                        switchToCategory1Focus,
                        switchToCountryCityFocus,
                        ...rowNavLabels,
                    ].forEach(el => {
                        el.setAttribute('tabindex', '-1');
                    });
                    return;
                case 'delete':
                    row.setAttribute('inert', '');
                    row.classList.remove('active');
                    row.style.height = 0 + 'px';
                    return;
                case 'resize':
                    rowSummary.style.height =
                        (rowSummary.clientHeight === 56 ? 56 : 80) + 'px';
                    rowDetails.style.height =
                        (rowDetails.clientHeight ?
                            rowDetails.scrollHeight
                        :   0) + 'px';
                    row.style.height =
                        (rowSummary.clientHeight === 56 ? 56 : 80) +
                        (rowDetails.clientHeight ?
                            rowDetails.scrollHeight
                        :   0) +
                        34 +
                        'px';
                    return;
                default:
                    if (rowSummary.clientHeight === 80)
                        this.#rowToggle(row, 'open');
                    if (rowSummary.clientHeight === 56)
                        this.#rowToggle(row, 'close');
                    return;
            }
        }, 0);
        setTimeout(() => {
            if (toggle !== 'resize' && validate !== 'validate')
                switchToDatesBtn.click();
            if (toggle === 'open' && !!startEl.pdcValue && !endEl.pdcValue)
                endEl.focusEl();
            row.classList.remove('toggling');
        }, 700);
    };

    #rowSwitchToDates = (row: Element) => {
        const { startEl, endEl } = this.#getRowPdcEls(row);
        const { switchToDatesBtn } = this.#getRowSwitcherEls(row);
        const { switchToCategory0Focus, switchToDatesFocus } =
            this.#getRowFocusEls(row);
        switchToCategory0Focus.setAttribute('tabindex', '0');
        switchToDatesFocus.setAttribute('tabindex', '-1');
        switchToDatesBtn.click();
        startEl.pdcValue ? endEl.focusEl() : startEl.focusEl();
        return;
    };

    #rowSwitchToCategory = (
        row: Element,
        pdc: 'switchToCategory0' | 'switchToCategory1',
    ) => {
        const { switchToCategoryBtn } = this.#getRowSwitcherEls(row);
        const { categoryEl } = this.#getRowPdcEls(row);
        const {
            switchToDatesFocus,
            switchToCategory0Focus,
            switchToCategory1Focus,
            switchToCountryCityFocus,
        } = this.#getRowFocusEls(row);
        pdc === 'switchToCategory0' ?
            switchToCategory0Focus.setAttribute('tabindex', '-1')
        :   switchToCategory1Focus.setAttribute('tabindex', '-1');
        switchToDatesFocus.setAttribute('tabindex', '0');
        switchToCountryCityFocus.setAttribute('tabindex', '0');
        switchToCategoryBtn.click();
        setTimeout(() => {
            categoryEl.focusEl(pdc === 'switchToCategory0' ? 0 : 1);
        }, 300);
    };

    #rowSwitchToCountryCity = (row: Element) => {
        const { countryEl } = this.#getRowPdcEls(row);
        const { switchToCountryCityBtn } = this.#getRowSwitcherEls(row);
        const { switchToCategory1Focus, switchToCountryCityFocus } =
            this.#getRowFocusEls(row);
        switchToCountryCityFocus.setAttribute('tabindex', '-1');
        switchToCategory1Focus.setAttribute('tabindex', '0');
        switchToCountryCityBtn.click();
        setTimeout(() => {
            countryEl.focusEl();
        }, 300);
    };

    rowLoadingSpinner(rowIndex: number, enabled: boolean) {
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

    /* Validation
     */

    #getValidators = (): (
        | PdcLocationDate
        | PdcLocationCategory
        | PdcLocationSelect
    )[] => {
        if (!this.shadowRoot)
            throw new Error('Failed to render ShadowRoot for location View.');
        const dates =
            this.shadowRoot.querySelectorAll<PdcLocationDate>(
                'pdc-location-date',
            );
        const categories =
            this.shadowRoot.querySelectorAll<PdcLocationCategory>(
                'pdc-location-category',
            );
        const selects = this.shadowRoot.querySelectorAll<PdcLocationSelect>(
            'pdc-location-select',
        );
        return [...dates, ...categories, ...selects];
    };

    #validateEl = (
        el: PdcLocationDate | PdcLocationCategory | PdcLocationSelect,
    ): boolean => {
        const valid = el.validate();
        if (!valid) {
            const row = el.closest<HTMLElement>('[data-pdc="location-row"]');
            if (!row) throw new Error('Failed to get row during validation.');
            const {
                switchToDatesBtn,
                switchToCategoryBtn,
                switchToCountryCityBtn,
            } = this.#getRowSwitcherEls(row);

            if (el instanceof PdcLocationDate) switchToDatesBtn.click();
            if (el instanceof PdcLocationCategory) switchToCategoryBtn.click();
            if (el instanceof PdcLocationSelect) switchToCountryCityBtn.click();

            this.#rowToggle(row, 'open', 'validate');
        }
        return valid;
    };

    #validateRows = (): boolean => {
        const validators = this.#getValidators();
        this.#valid = validators.every(el => this.#validateEl(el));
        return this.#valid;
    };

    /* Controller / View interaction
     */

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

    #returnRowObject = (
        target: Element,
        updateSummary: boolean = true,
    ): StateLocationItem => {
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
        if (updateSummary) this.#updateRowSummary(result);
        return result;
    };

    #returnAllRowsOjbect = (): StateLocationItem[] => {
        const { rowsContainer } = this.#getViewEls();
        const rows = rowsContainer.querySelectorAll(
            '[data-pdc="location-row"]',
        );
        if (!rows) throw new Error('Failed to get all rows.');
        const result = [...rows].map(row => {
            return this.#returnRowObject(row, false);
        });
        this.removeAttribute('update-state');
        return result;
    };

    #returnValidation = (): AllViewLocationsValid => {
        this.removeAttribute('validate');
        const { rowsContainer } = this.#getViewEls();
        const rows = rowsContainer.querySelectorAll<HTMLElement>(
            '[data-pdc="location-row"]',
        );
        rows && rows.forEach(row => this.#rowToggle(row, 'close'));
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

    transitionRow(index: number, updatedAttr: LocationKeys): void {
        if (!this.#styled) return; // No transitions in unstyled config
        // Switch between input pages/row opening based on current row values
        const row = this.#getRowFromIndex(index);
        const { cityEl } = this.#getRowPdcEls(row);
        switch (updatedAttr) {
            case 'city':
                setTimeout(() => {
                    this.#rowToggle(row, 'close');
                }, 250);
                return;
            case 'country':
                cityEl.enable(true);
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
            this.#getRowPdcEls(row);
        startEl.restrictStartInput();
        endEl.restrictEndInput();
        categoryEl.enableCategory(false);
        countryEl.enable(false);
        cityEl.enable(false);
        endEl.focusEl();
    }

    #transitionEnd(row: Element): void {
        const { startEl, endEl, categoryEl, countryEl, cityEl } =
            this.#getRowPdcEls(row);
        startEl.restrictStartInput();
        endEl.restrictEndInput();
        categoryEl.enableCategory(true);
        countryEl.enable(false);
        cityEl.enable(false);
        this.#rowSwitchToCategory(row, 'switchToCategory0');
    }

    #transitionCategory(row: Element) {
        const { countryEl, cityEl } = this.#getRowPdcEls(row);
        countryEl.enable(true);
        cityEl.enable(false);
        this.#rowSwitchToCountryCity(row);
    }
}
