// TODO3 Refine controller class method for getting data
// TODO2 Double-check errors, trace to root function and eliminate try/catch in child functions
// LAST Testing (Jest)
// LAST Search to see if API key in build files
// LAST Restrict access control allow origin on proxy

// Types
import type {
    LocationKeys,
    StateLocationItem,
    AllViewLocationsValid,
} from './types/locations';
import { StateExpenseItemUpdate } from './types/expenses';
import type { Config, State } from './types/config';

// Utils
import * as model from './model';
import { sanitizeConfig } from './utils/misc';

// Views
import { PdcLocationView } from './views';
import { PdcExpenseView } from './views';

export class Pdc {
    #eventTarget;
    #container: Element;
    #config: Config;
    #viewLocation = new PdcLocationView();
    #viewExpense = new PdcExpenseView();

    constructor(container: Element, configUser: Partial<Config> | null = null) {
        this.#eventTarget = new EventTarget();

        this.#container = container;
        this.#config = sanitizeConfig(configUser);

        const { styled, location: config } = this.#config;

        this.#viewLocation.render(styled, { ...config });
        this.#viewLocation.controllerHandler(
            this.#locationUpdated,
            this.#locationDeleted,
            this.#locationsValidate,
        );

        this.#container.insertAdjacentElement('afterbegin', this.#viewLocation);
        this.#container.insertAdjacentElement('beforeend', this.#viewExpense);
    }

    #locationDeleted = (updatedRows: StateLocationItem[]) => {
        this.#viewExpense.renderEmtpy();
        model.updateAllStateLocations(updatedRows);
    };

    #locationUpdated = async (
        row: StateLocationItem,
        changedAttr: LocationKeys,
        newValue: string | null,
    ) => {
        const { index, start, end, category, country, city } = row;
        this.#viewExpense.renderEmtpy();
        model.updateStateLocation(row);

        switch (true) {
            case !newValue && !!country && !!category && !!end && !!start:
                this.#viewLocation.transitionRow(index, 'country');
                await this.#createSelectOptions(row);
                return;
            case !newValue && !!category && !!end && !!start:
                this.#viewLocation.transitionRow(index, 'category');
                await this.#createSelectOptions(row);
                return;
            case !newValue && !!end && !!start:
                this.#viewLocation.transitionRow(index, 'end');
                return;
            case !newValue:
                this.#viewLocation.transitionRow(index, 'start');
                return;
            case (changedAttr === 'start' || changedAttr === 'end') && // To account for when rows are deleted and the only updates are to the start/end dates of prev/next rows
                !!start &&
                !!end &&
                !!category &&
                !!country &&
                !!city:
                const startDate = new Date(start);
                const endDate = new Date(end);
                if (startDate <= endDate) {
                    return;
                } else {
                    this.#viewLocation.transitionRow(index, changedAttr);
                }
                return;
            default:
                this.#viewLocation.transitionRow(index, changedAttr);
                if (changedAttr === 'category' || changedAttr === 'country') {
                    await this.#createSelectOptions(row);
                }
                return;
        }
    };

    #createSelectOptions = async (row: StateLocationItem) => {
        const { index } = row;
        this.#viewLocation.renderLoadingSpinner(index, true);
        const list = await model.returnOptions(row);
        const locationCategory = !!row.country ? 'city' : 'country';
        this.#viewLocation.setOptions(index, list, locationCategory);
        this.#viewLocation.renderLoadingSpinner(index, false);
    };

    #locationsValidate = async (viewValidator: AllViewLocationsValid) => {
        try {
            this.#viewExpense.renderEmtpy();
            const { valid, expensesCategory } = viewValidator;
            if (!valid || !expensesCategory) return;
            const modelValidate = model.validateStateLocations();
            console.log(modelValidate);
            if (!modelValidate) return;

            const { styled, expense: config } = this.#config;
            this.#viewExpense.render(styled, { ...config });
            this.#viewExpense.renderLoadingSpinner(true);
            this.#viewExpense.handlerRowUpdate(this.#expenseUpdate);

            const expenses = await model.generateExpenses(viewValidator);
            this.#viewExpense.addRows(expenses, expensesCategory);
            this.#viewExpense.renderLoadingSpinner(false);
            this.#dispatchEvent();
        } catch (error) {
            console.error(error);
        }
    };

    #expenseUpdate = (row: StateExpenseItemUpdate) => {
        const { date, newRowMieTotal, totalMie, totalLodging } =
            model.updateStateExpenseItem(row);
        this.#viewExpense.updateRowMie(
            date,
            newRowMieTotal,
            totalMie,
            totalLodging,
        );
        this.#dispatchEvent();
    };

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
}
