import { LocationFromList, handlerResult } from './ts/config';
import * as model from './ts/model';

import PdcLocationView from './ts/views/location-view';

const container = document.querySelector('#perDiemCalc');
let pdcLocationView: PdcLocationView;
if (container instanceof HTMLFormElement)
  pdcLocationView = new PdcLocationView(container);

const controlRowCategory = (result: handlerResult) => {
  const { category, row } = result;
  if (!category) return;
  const list: LocationFromList[] = model.getCategoryList(category);
  pdcLocationView.setStateOptions(list, row);
};

const controlRowState = async (result: handlerResult) => {
  const { category, state, row } = result;
  if (!category && !state) return;
  const cities = await model.getCityOptions(category, state);
  if (!cities) return;
  pdcLocationView.setCityOptions(cities, row);
};

const init = () => {
  if (!(pdcLocationView instanceof PdcLocationView)) return;

  pdcLocationView.render();
  pdcLocationView.handlerRowCategory(controlRowCategory);
  pdcLocationView.handlerRowState(controlRowState);
};

init();
