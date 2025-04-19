import {
  LocationFromList,
  LocationFromFetch,
  LIST_STATES_CONUS,
  LIST_STATES_OCONUS,
} from './config';

export const getCategoryList = (category: string): LocationFromList[] => {
  return category === 'domestic' ? LIST_STATES_CONUS : LIST_STATES_OCONUS;
};

const getResults = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to get API results from ${url}.`);
    const result = await res.json();
    return result;
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

export const getCityOptions = async (category: 'domestic' | 'intl', state: string) => {
  try {
    const url =
      category === 'domestic' ?
        'https://api.gsa.gov/travel/perdiem/v2/rates/conus/lodging/2025?api_key=4CYBZhljv7xr8EzHPfcZEWriMgvTJulbBzK6tPgT'
      : '/OCONUSrates/2024.json';
    const data: LocationFromFetch[] = await getResults(url);

    const fitleredData = data.filter(
      rate => rate.State !== null && rate.State.toLowerCase() === state.toLowerCase(),
    );

    if (category === 'domestic')
      return fitleredData
        .filter(rate => rate.City === 'Standard Rate')
        .concat(
          fitleredData
            .filter(rate => rate.City !== 'Standard Rate')
            .sort((a, b) => a.City.localeCompare(b.City)),
        );

    if (category === 'intl')
      return fitleredData
        .sort((a, b) => a.City.localeCompare(b.City))
        .filter(
          (rate, index, array) =>
            index > 0 && rate.City.toLowerCase() !== array[index - 1].City.toLowerCase(),
        );
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};
