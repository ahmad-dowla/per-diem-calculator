import type {
  LocationFromList,
  LocationCities,
  LocationCategory,
  RateAPIRequest,
  LodgingRow,
  DateRaw,
  ForeignPerDiem,
} from './config';
import { isShortMonth, LIST_STATES, LongMonths } from './config';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

const urlPerDiemForeign = (dateRaw: DateRaw): string => {
  const date = new Date(dateRaw);
  const year = date.getUTCFullYear();
  const shortMonth = date.toUTCString().slice(8, 11);
  if (!isShortMonth(shortMonth)) return 'invalidUrl';
  const longMonth = LongMonths[shortMonth];
  return `${import.meta.env.VITE_CORS_API_URL}&url=https://aoprals.state.gov/content/Documents/${longMonth}${year}PD.xls`;
};

const urlPerDiemDomesticCities = (dateRaw: DateRaw): string => {
  return `https://api.gsa.gov/travel/perdiem/v2/rates/conus/lodging/${dateRaw.slice(0, 4)}?api_key=${import.meta.env.VITE_GSA_API_KEY}`;
};

const getFetchResult = async <T>(url: string): Promise<T[]> => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to get API results from ${url}.`);
    const result = await res.json();
    return result;
  } catch (error) {
    console.error(`Error: ${error}`);
    return [];
  }
};

const getExcelResult = async <T>(url: string): Promise<T[]> => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Unable to get API response from ${url}`);
    const resFile = await res.arrayBuffer();
    if (!resFile) throw new Error(`Problem parsing file from ${url}`);
    const file = xlsxRead(resFile);
    const sheet: T[] = xlsxUtils.sheet_to_json(file.Sheets[file.SheetNames[0]], {
      raw: false,
    });
    return sheet;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getStateResults = (category: LocationCategory): LocationFromList[] => {
  return LIST_STATES.filter(state => state.category === category);
};

export const getCityResults = async (
  category: LocationCategory,
  state: string,
  date: DateRaw,
) => {
  try {
    const url =
      category === 'domestic' ? urlPerDiemDomesticCities(date) : urlPerDiemForeign(date);

    if (category === 'domestic') {
      const data = await getFetchResult<LocationCities>(url);
      const fitleredData = data.filter(
        rate =>
          rate.State &&
          rate.State !== null &&
          rate.State.toLowerCase() === state.toLowerCase(),
      );
      return fitleredData
        .filter(rate => rate.City === 'Standard Rate')
        .concat(
          fitleredData
            .filter(rate => rate.City !== 'Standard Rate')
            .sort((a, b) => (a.City ?? '').localeCompare(b.City ?? '')),
        );
    }

    if (category === 'intl') {
      const data = await getExcelResult<LocationCities>(url);
      const fitleredData = data.filter(
        rate => rate.Country && rate.Country.toLowerCase() === state.toLowerCase(),
      );
      return fitleredData
        .sort((a, b) => (a.Location ?? '').localeCompare(b.Location ?? ''))
        .filter((rate, index, array) => {
          if (index === 0) return true;
          const prevRate = array[index - 1];
          return (
            rate.Location &&
            prevRate.Location &&
            rate.Location.toLowerCase() !== prevRate.Location.toLowerCase()
          );
        });
    }
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

export const getRates = async (arr: RateAPIRequest): Promise<LodgingRow[]> => {
  try {
    const result: LodgingRow[] = [];
    let prevUrl = '';
    let prevRates: ForeignPerDiem[] = [];

    for (const location of arr.expenseDatesLocations) {
      const { date: dateTripRaw, city, state } = location;
      const createObj = (maxRate: number) => {
        return { date: dateTripRaw, location: `${city} (${state})`, maxRate: +maxRate };
      };
      const currentUrl = urlPerDiemForeign(dateTripRaw);
      console.log(currentUrl);

      if (prevUrl === currentUrl) {
        console.log('using previous file');
        prevRates.forEach(rate => {
          if (!checkRate(dateTripRaw, rate)) return;
          const obj: LodgingRow = createObj(rate.Lodging);
          result.push(obj);
        });
      }
      if (prevUrl !== currentUrl) {
        console.log('using new file');
        const res = await getExcelResult<ForeignPerDiem>(currentUrl);
        const rates = res.filter(
          res =>
            res.Location.toLowerCase() === city.toLowerCase() &&
            res.Country.toLowerCase() === state.toLowerCase(),
        );
        prevRates = rates;
        prevUrl = currentUrl;
        rates.forEach(rate => {
          if (!checkRate(dateTripRaw, rate)) return;
          const obj: LodgingRow = createObj(rate.Lodging);
          result.push(obj);
        });
      }
    }

    result.sort((a, b) => a.date.localeCompare(b.date));
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
    return [];
  }
};

const checkRate = (dateTripRaw: DateRaw, rate: ForeignPerDiem) => {
  const excelDate = (date: string) => {
    const datePieces = date.split('-');
    let fixedDateString: string = '';

    if (datePieces.length === 2) {
      fixedDateString =
        datePieces[0].length === 3 ?
          `${datePieces[0]} ${datePieces[1]} ${dateTripRaw.slice(0, 4)} Z`
        : `${datePieces[1]} ${datePieces[0]} ${dateTripRaw.slice(0, 4)} Z`;
    }
    if (datePieces.length === 3) {
      fixedDateString = `${datePieces[1]} ${datePieces[0]} ${datePieces[2]} Z`;
    }
    const fixedDate = new Date(fixedDateString);
    return fixedDate.toISOString();
  };

  // Because the Season Start and Season End values don't have real years, we are artificially adding them based on the trip date e.g. 2025-04-01 will turn start 12/31 and end 03/31 to start 2025-12-31 and end 2025-03-31
  const dateStartRaw = excelDate(rate['Season Start Date']);
  const dateEndRaw = excelDate(rate['Season End Date']);
  const dateStart = new Date(dateStartRaw);
  const dateEnd = new Date(dateEndRaw);

  // To account for rates that are effective from the end of one year to the start of the next e.g. 10/01 to 03/01 would be 10/01/22 to 03/01/22, but with the below it will be 10/01/21 to 03/01/23, and we'll rely on the eff_date and exp_date to provide the remaining controls
  if (dateEnd < dateStart) {
    dateStart.setUTCFullYear(dateStart.getUTCFullYear() - 1);
  }

  // Use rate if trip date falls within the right range
  const dateTrip = new Date(`${dateTripRaw} Z`);

  const dateEffectiveRaw = excelDate(rate['Effective Date']);
  const dateEffective = new Date(`${dateEffectiveRaw}`);

  // console.log(
  //   `Trip: ${dateTrip.toISOString().slice(0, 10)}\nStart: ${dateStart.toISOString().slice(0, 10)}\nEnd: ${dateEnd.toISOString().slice(0, 10)}\nEffective: ${dateEffective.toISOString().slice(0, 10)}\n\nTrip >= Eff ${dateTrip.getTime() >= dateEffective.getTime()}\nTrip >= Start ${dateTrip} ${dateStart}\nTrip <= End ${dateTrip.getTime() <= dateEnd.getTime()}`,
  // );

  return (
    dateTrip.getTime() >= dateEffective.getTime() &&
    dateTrip.getTime() >= dateStart.getTime() &&
    dateTrip.getTime() <= dateEnd.getTime()
  );
};
