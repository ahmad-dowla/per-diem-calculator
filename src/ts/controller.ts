import type { LocationFromList, RateAPIRequest, LocationRow } from './config';

import * as model from './model';

import PdcLocationView from './location/location.view';
import PdcLodgingView from './lodging/lodging.view';
import PdcMealsView from './meals/meals.view';

const container = document.querySelector<HTMLFormElement>('#perDiemCalc');
let viewLocation: PdcLocationView;
let viewLodging: PdcLodgingView;
let viewMeals: PdcMealsView;
if (container) {
  viewLocation = new PdcLocationView(container);
  viewLodging = new PdcLodgingView(container);
  viewMeals = new PdcMealsView(container);
}

// Controllers for Location
const controlRowCategory = (result: LocationRow) => {
  const { category, row } = result;
  if (!category) return;
  const list: LocationFromList[] = model.getStateResults(category);
  viewLocation.setStateOptions(list, row);
};

const controlRowState = async (result: LocationRow) => {
  const { category, state, date, row } = result;
  if (!category && !state && !date) return;
  const cities = await model.getCityResults(category, state, date);
  if (!cities || cities.length === 0) return;
  viewLocation.setCityOptions(cities, row, category);
};

const controlLocationsValid = async (result: RateAPIRequest) => {
  if (!result) return;
  const rates = await model.getRates(result);
  if (!rates || rates.length === 0) return;
  viewLodging.addRows(rates);
  viewMeals.addRows(rates);
};

export const init = () => {
  if (!(viewLocation instanceof PdcLocationView)) return;

  viewLocation.render();
  viewLocation.handlerRowCategory(controlRowCategory);
  viewLocation.handlerRowState(controlRowState);
  viewLocation.hanlderValidate(controlLocationsValid);

  viewLodging.render();
  viewMeals.render();
};
