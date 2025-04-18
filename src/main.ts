import pdcLocationContainer from './ts/components/location-container';
customElements.define('pdc-location-container', pdcLocationContainer);

const pdc = document.querySelector('#perDiemCalc') as HTMLFormElement;
pdc.innerHTML = `<pdc-location-container></pdc-location-conntainer>`;
