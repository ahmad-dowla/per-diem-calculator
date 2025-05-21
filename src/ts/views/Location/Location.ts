// TODO Apply new table style to expenses

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

    /* Event handlers
     */
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

    /* Getters for elements needed in multiple methods
     */

    #getViewEls = () => {
        const rowsContainer =
            this.shadowRoot?.querySelector<HTMLElement>('#rows');
        const rows = rowsContainer?.querySelectorAll<HTMLElement>(
            '[data-pdc="location-row"]',
        );
        if (!(rowsContainer && rows))
            throw new Error('Failed to render elements for location View.');
        return {
            rowsContainer,
            rows,
        };
    };

    #getRowElFromIndex(rowIndex: number) {
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
            throw new Error('Failed to render row custom elements.');
        return {
            startEl,
            endEl,
            categoryEl,
            countryEl,
            cityEl,
        };
    }

    #getRowAnimatedEls(row: Element) {
        const rowDeleteAnimateEl = row.querySelector<HTMLButtonElement>(
            'button[data-pdc="delete-row"]',
        );
        const rowSummaryAnimateEl = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-summary"]',
        );
        const rowDetailsAnimateEl = row.querySelector<HTMLElement>(
            '[data-pdc="location-row-details"]',
        );
        if (!(rowDeleteAnimateEl && rowSummaryAnimateEl && rowDetailsAnimateEl))
            throw new Error('Failed to render row summary elements.');
        return {
            rowDeleteAnimateEl,
            rowSummaryAnimateEl,
            rowDetailsAnimateEl,
        };
    }

    /* Row add/delete/update methods
     */

    #addRow(initial: 'initial' | null = null) {
        if (!this.#validateRows()) return; // Validate before adding rows
        templateRow.innerHTML =
            this.#styled ? templateRowHTML : removeStyles(templateRowHTML);
        this.#getViewEls().rowsContainer.appendChild(
            templateRow.content.cloneNode(true),
        );
        const newRow = this.#getViewEls().rowsContainer.lastElementChild;
        if (!(newRow instanceof HTMLElement))
            throw new Error('Failed to render new row');
        this.#rowToggle(newRow, initial ? initial : 'add');
    }

    async #deleteRow(row: HTMLElement) {
        if (this.#getViewEls().rowsContainer.childElementCount === 1) {
            const errorEl = this.shadowRoot?.querySelector('#error');
            errorEl?.classList.add('active');
            if (errorEl) errorEl.textContent = '1 row required.';
            return;
        }
        const prevRow = row.previousElementSibling;
        const nextRow = row.nextElementSibling;
        await this.#rowToggle(row, 'delete', nextRow);

        // Update date input restrictions for existing rows
        prevRow && this.#getRowPdcEls(prevRow).startEl.restrictStartInput();
        prevRow && this.#getRowPdcEls(prevRow).endEl.restrictStartInput();
        nextRow && this.#getRowPdcEls(nextRow).startEl.restrictStartInput();
        nextRow && this.#getRowPdcEls(nextRow).endEl.restrictStartInput();

        // Trigger #observer to update state
        this.#getViewEls().rowsContainer.setAttribute('update-state', `true`);
    }

    #getRowIndex(row: Element) {
        if (!row.parentNode)
            throw new Error(`Failed to get row index in Location View.`);
        return Array.from(
            row.parentNode.querySelectorAll('[data-pdc="location-row"]'),
        ).indexOf(row);
    }

    #updateRowSummary(location: StateLocationItem): void {
        const { index, start, end, country, city } = location;
        const row = this.#getRowElFromIndex(index);

        // Get elements
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

        // Get values
        const rowCount = (index + 1).toString().padStart(2, '0');
        const startDate = start ? getShortDate(start) : '\u00A0';
        const endDate = end ? ` to ${getShortDate(end)}` : '\u00A0';
        const countryCity = city && country ? `${city} (${country})` : '\u00A0';
        // Update els with values
        rowNumberEl.textContent = rowCount;
        rowSummaryDatesEl.textContent = startDate + endDate;
        rowSummaryLocationEl.textContent = countryCity;
    }

    setOptions(
        rowIndex: number,
        arr: Location[],
        locationCategory: Extract<LocationKeys, 'country' | 'city'>,
    ) {
        const row = this.#getRowElFromIndex(rowIndex);
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
        this.#getRowAnimatedEls(row).rowDeleteAnimateEl.setAttribute(
            'tabindex',
            enable ? '-1' : '0',
        );
    }

    /* Row visual methods
     */

    #clearErrorEl() {
        this.shadowRoot?.querySelector('#error')?.classList.remove('active');
    }

    #rowToggle = async (
        row: HTMLElement,
        toggle: 'open' | 'close' | 'add' | 'initial' | 'delete' | null = null,
        nextRow: Element | null = null,
    ) => {
        if (!this.#styled || row.classList.contains('toggling')) return;

        // If no specific toggle set, fire either open or close based on current row height
        if (!toggle) {
            this.#rowToggle(row, row.offsetHeight === 96 ? 'open' : 'close');
            return;
        }

        // Update classes/styles
        row.classList.remove(
            'pdc-row-open',
            'pdc-row-initial',
            'pdc-row-add',
            'pdc-row-close',
        );
        row.classList.add('toggling', `pdc-row-${toggle}`);

        // Pre-toggle adjustments
        (toggle === 'close' || toggle === 'delete') && this.#clearErrorEl();
        toggle === 'open' && this.#checkAllRowsClosed('open');
        if (toggle === 'add' || toggle === 'initial') {
            if (
                this.#getViewEls().rowsContainer.childElementCount > 1 &&
                toggle === 'add'
            )
                this.#checkAllRowsClosed('open'); // Trigger animation only if there are existing rows
            this.#setRowBgColor(row);
            this.#returnRowObject(row); // Sets row count
        }

        // Fire toggles
        if (toggle === 'open' || toggle === 'add' || toggle === 'initial')
            await this.#rowToggleOpen(row);
        if (toggle === 'close') await this.#rowToggleClose(row);
        if (toggle === 'delete') await this.#rowToggleDelete(row, nextRow);

        if (toggle !== 'delete') {
            row.classList.remove('ring-transparent');
            row.classList.add('ring-neutral-200');
        }
        row.classList.remove('toggling');
    };

    #rowToggleOpen = async (row: HTMLElement) => {
        // MAGIC 700
        await wait(700);
        this.#enableRowTabIndex(row, true);
        row.style.height = row.scrollHeight + 'px';
        const { rowDetailsAnimateEl, rowSummaryAnimateEl, rowDeleteAnimateEl } =
            this.#getRowAnimatedEls(row);
        [rowSummaryAnimateEl, rowDeleteAnimateEl].forEach(
            el => (el.style.opacity = '0'),
        );
        rowDetailsAnimateEl.style.opacity = '100';
        rowDetailsAnimateEl.style.transform = `translateX(100%)`;
        rowSummaryAnimateEl.style.transform = `translateY(-200%)`;
        rowDeleteAnimateEl.style.transform = `translateX(200%)`;
    };

    #rowToggleClose = async (row: HTMLElement) => {
        // MAGIC 750
        await wait(750);
        this.#enableRowTabIndex(row, false);
        row.style.height = row.clientHeight + 'px';
        const { rowDetailsAnimateEl, rowSummaryAnimateEl, rowDeleteAnimateEl } =
            this.#getRowAnimatedEls(row);
        [rowSummaryAnimateEl, rowDeleteAnimateEl].forEach(
            el => (el.style.opacity = '100'),
        );
        rowDetailsAnimateEl.style.opacity = '0';
        rowDetailsAnimateEl.style.transform = `translateX(0%)`;
        rowSummaryAnimateEl.style.transform = `translateY(0%)`;
        rowDeleteAnimateEl.style.transform = `translateX(0%)`;
        this.#checkAllRowsClosed();
    };

    #rowToggleDelete = async (
        row: HTMLElement,
        nextRow: Element | null = null,
    ) => {
        row.classList.remove('ring-neutral-300');
        row.classList.add('ring-transparent');
        await wait(800);
        // Deleted row was only row -> add a blank template row
        row.remove();
        this.#checkAllRowsClosed();
        if (nextRow) {
            // For any next rows
            const index = this.#getRowIndex(nextRow);
            [...this.#getViewEls().rows]
                .filter((_, i) => i >= index)
                .map(remainingRow => {
                    this.#returnRowObject(remainingRow); // Update summary number
                    this.#setRowBgColor(remainingRow); // Update background color
                });
        }
    };

    #checkAllRowsClosed(open: 'open' | null = null) {
        const addRowBtnEl = this.shadowRoot
            ?.querySelector('#add-row')
            ?.closest('div');
        const expenseCategoryBtnEl =
            this.shadowRoot?.querySelector<HTMLElement>('#expense-category');
        const generateExpensesBtnEl = this.shadowRoot
            ?.querySelector('#generate-expenses')
            ?.closest('div');
        if (!(addRowBtnEl && expenseCategoryBtnEl && generateExpensesBtnEl))
            throw new Error('Failed to render view buttons.');
        const btns = [addRowBtnEl, expenseCategoryBtnEl, generateExpensesBtnEl];
        const rowsOpen = [...this.#getViewEls().rows].some(
            // MAGIC 96
            row => row.offsetHeight !== 96,
        );
        if (!!open || rowsOpen) this.#animateBtnsRowsOpen(btns);
        else this.#animateBtnsRowsClosed(btns);
    }

    async #animateBtnsRowsOpen(btns: HTMLElement[]) {
        btns.forEach(btn => btn.classList.remove('rows-closed'));
        btns.forEach(btn => btn.classList.add('rows-open'));
        const addRowBtnEl = btns[0];
        const expenseCategoryBtnEl = btns[1];
        const generateExpensesBtnEl = btns[2];
        // MAGIC 450
        await wait(450);
        btns.forEach(btn => (btn.style.zIndex = '0'));
        addRowBtnEl.style.transform = `translateY(-100%)`;
        expenseCategoryBtnEl.style.transform = `translateY(400%)`;
        generateExpensesBtnEl.style.transform = `translateY(200%)`;
    }

    async #animateBtnsRowsClosed(btns: HTMLElement[]) {
        btns.forEach(btn => btn.classList.remove('rows-open'));
        btns.forEach(btn => btn.classList.add('rows-closed'));
        // MAGIC 450
        await wait(450);
        btns.forEach(btn => {
            btn.style.zIndex = '50';
            btn.style.transform = `translateY(0%)`;
        });
    }

    #windowResize = () => {
        [...this.#getViewEls().rows].forEach(row => {
            if (row.offsetHeight === 96) return;
            row.style.height =
                this.#getRowAnimatedEls(row).rowDetailsAnimateEl.scrollHeight +
                'px';
        });
    };

    #setRowBgColor = (row: HTMLElement) => {
        const index = this.#getRowIndex(row);
        const color = index % 2 === 0 ? 'neutral-50' : 'white';
        const oppColor = color === 'neutral-50' ? 'white' : 'neutral-50';
        row.classList.remove('bg-white', 'bg-neutral-50');
        row.classList.add(`bg-${color}`);
        row.style.zIndex = index.toString();
        [...this.#getRowAnimatedEls(row).rowDetailsAnimateEl.children].forEach(
            (el, i) => {
                el.setAttribute('bg', i % 2 === 0 ? color : oppColor);
            },
        );
    };

    showLoadingSpinner(
        rowIndex: number,
        enabled: boolean,
        locationCategory: Extract<LocationKeys, 'country' | 'city'>,
    ) {
        if (!this.#styled) return;
        const row = this.#getRowElFromIndex(rowIndex);
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
            this.#getViewEls().rowsContainer.querySelectorAll<PdcLocationDate>(
                'pdc-location-date',
            );
        const categories =
            this.#getViewEls().rowsContainer.querySelectorAll<PdcLocationCategory>(
                'pdc-location-category',
            );
        const selects =
            this.#getViewEls().rowsContainer.querySelectorAll<PdcLocationSelect>(
                'pdc-location-select',
            );
        return [...dates, ...categories, ...selects];
    };

    #validatePdcEl = (
        el: PdcLocationDate | PdcLocationCategory | PdcLocationSelect,
    ): boolean => {
        if (!el.validate()) {
            const row = el.closest<HTMLElement>('[data-pdc="location-row"]');
            if (row?.classList.contains('pdc-row-close'))
                this.#rowToggle(row, 'open');
        }
        return el.validate();
    };

    #validateRows = (generate: 'generate' | null = null): boolean => {
        const validators = this.#getValidators();
        this.#valid = validators.every(el => this.#validatePdcEl(el));
        if (generate === 'generate')
            this.#getViewEls().rowsContainer.setAttribute(
                'validate',
                `${this.#valid}`,
            );
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
        const result = [...this.#getViewEls().rows].map(row => {
            return this.#returnRowObject(row);
        });
        this.removeAttribute('update-state');
        return result;
    };

    #returnValidation = (): AllViewLocationsValid => {
        this.removeAttribute('validate');
        this.#getViewEls().rows.forEach(row => this.#rowToggle(row, 'close'));
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

    async transitionRow(index: number, updatedAttr: LocationKeys) {
        if (!this.#styled) return; // No transitions in unstyled config
        // Switch between input pages/row opening based on current row values
        const row = this.#getRowElFromIndex(index);
        const { cityEl } = this.#getRowPdcEls(row);
        // MAGIC 250
        switch (updatedAttr) {
            case 'city':
                await wait(250);
                this.#rowToggle(row, 'close');
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
        categoryEl.enable(false);
        countryEl.enable(false);
        cityEl.enable(false);

        startEl.restrictStartInput();
        endEl.restrictEndInput();
    }

    #transitionEnd(row: Element): void {
        const { startEl, endEl, categoryEl, countryEl, cityEl } =
            this.#getRowPdcEls(row);

        countryEl.enable(false);
        cityEl.enable(false);

        startEl.restrictStartInput();
        endEl.restrictEndInput();

        categoryEl.enable(true);
    }

    #transitionCategory(row: Element) {
        const { countryEl, cityEl } = this.#getRowPdcEls(row);

        cityEl.enable(false);

        countryEl.enable(true);
    }
}
