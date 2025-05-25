// Types
import type {
    LocationKeys,
    StateLocationItem,
    AllViewLocationsValid,
} from './types/locations';
import { StateExpenseItemUpdate } from './types/expenses';
import type { Config } from './types/config';

// Utils
import { sanitizeConfig } from './utils/config';

// Model
import * as model from './model';

// Views
import { PdcLocationView } from './views';
import { PdcExpenseView } from './views';
customElements.define('pdc-expense-view', PdcExpenseView);
customElements.define('pdc-location-view', PdcLocationView);

export class Pdc {
    /* SETUP
     */
    #container: Element;
    #config: Config;
    #viewLocation;
    #viewExpense;
    #styled;
    #eventTarget;

    constructor(container: Element, configUser: Partial<Config> | null = null) {
        this.#container = container;
        this.#config = sanitizeConfig(configUser);
        this.#styled = this.#config.styled;

        this.#viewLocation = new PdcLocationView(
            this.#styled,
            this.#config.location,
        );
        this.#viewExpense = new PdcExpenseView();

        this.#viewLocation.controllerHandler(
            this.#locationUpdated,
            this.#locationDeleted,
            this.#locationsValidate,
        );
        this.#eventTarget = new EventTarget();

        this.#container.insertAdjacentElement('afterbegin', this.#viewLocation);
        this.#container.insertAdjacentElement('beforeend', this.#viewExpense);
    }

    #dispatchEvent() {
        const event = new CustomEvent('expenseUpdate', {
            detail: {
                data: model.returnExpenses(),
            },
        });
        this.#eventTarget.dispatchEvent(event);
    }

    addEventListener(eventName: 'expenseUpdate', callback: EventListener) {
        this.#eventTarget.addEventListener(eventName, callback);
    }

    removeEventListener(eventName: 'expenseUpdate', callback: EventListener) {
        this.#eventTarget.removeEventListener(eventName, callback);
    }

    /* LOCATION
     */
    #locationDeleted = async (
        updatedRows: StateLocationItem[],
    ): Promise<void> => {
        this.#viewExpense.renderEmtpy();
        model.updateAllStateLocations(updatedRows);
        const row = updatedRows[updatedRows.length - 1];
        const { index, start, end, category, country, city } = row;
        if (!city && country) {
            this.#viewLocation.restrictRow(index, 'country');
            await this.#createSelectOptions(row);
        }
        if (!country && category) {
            this.#viewLocation.restrictRow(index, 'category');
            await this.#createSelectOptions(row);
        }
        if (!end && start) this.#viewLocation.restrictRow(index, 'end');
        if (start && !end) this.#viewLocation.restrictRow(index, 'start');
    };

    #locationUpdated = async (
        row: StateLocationItem,
        changedAttr: LocationKeys,
        newValue: string | null,
    ): Promise<void> => {
        const { index, start, end, category, country, city } = row;
        this.#viewExpense.renderEmtpy();
        model.updateStateLocation(row);
        let startDate, endDate;
        switch (true) {
            case !newValue && !!country && !!category && !!end && !!start:
                this.#viewLocation.restrictRow(index, 'country');
                await this.#createSelectOptions(row);
                return;
            case !newValue && !!category && !!end && !!start:
                this.#viewLocation.restrictRow(index, 'category');
                await this.#createSelectOptions(row);
                return;
            case !newValue && !!end && !!start:
                this.#viewLocation.restrictRow(index, 'end');
                return;
            case !newValue:
                this.#viewLocation.restrictRow(index, 'start');
                return;
            case (changedAttr === 'start' || changedAttr === 'end') && // To account for when rows are deleted and the only updates are to the start/end dates of prev/next rows
                !!start &&
                !!end &&
                !!category &&
                !!country &&
                !!city:
                startDate = new Date(start);
                endDate = new Date(end);
                if (startDate <= endDate) {
                    return;
                } else {
                    this.#viewLocation.restrictRow(index, changedAttr);
                }
                return;
            default:
                this.#viewLocation.restrictRow(index, changedAttr);
                if (changedAttr === 'category' || changedAttr === 'country') {
                    await this.#createSelectOptions(row);
                }
                return;
        }
    };

    #createSelectOptions = async (row: StateLocationItem) => {
        const { index } = row;
        const locationCategory = row.country ? 'city' : 'country';
        const list = await model.returnOptions(row);
        this.#viewLocation.createOptions(index, list, locationCategory);
    };

    #locationsValidate = (viewValidator: AllViewLocationsValid): void => {
        this.#viewExpense.renderEmtpy();
        if (!viewValidator.valid) return;
        if (!model.validateStateLocations()) return;
        this.#createExpenses(viewValidator);
    };

    /* EXPENSE
     */
    async #createExpenses(viewValidator: AllViewLocationsValid) {
        try {
            this.#viewExpense.render(this.#styled, this.#config.expense);
            this.#viewExpense.renderLoadingSpinner(true);
            this.#viewExpense.controllerHandler(
                this.#expenseUpdated,
                this.#expenseTable,
            );
            const expenses = await model.generateExpenses(viewValidator);
            await this.#viewExpense.addRows(
                expenses,
                viewValidator.expensesCategory,
            );
            this.#viewExpense.renderLoadingSpinner(false);
            this.#dispatchEvent();
        } catch (error) {
            console.error(error);
        }
    }

    #expenseUpdated = (row: StateExpenseItemUpdate): void => {
        const { date, newRowMieTotal, totalMie, totalLodging } =
            model.updateStateExpenseItem(row);
        this.#viewExpense.updateRowMie(
            date,
            newRowMieTotal,
            totalMie,
            totalLodging,
        );
        this.#viewExpense.emptyExpenseTable();
        this.#dispatchEvent();
    };

    #expenseTable = (): void => {
        this.#viewExpense.createExpenseTable(model.returnExpenses());
    };
}
