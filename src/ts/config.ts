// Text
export const LOCATION_HEADER = 'Date and Location';
export const LOCATION_TEXT = '';

// Utilities

export const inPrimitiveType = <T>(values: readonly T[], x: any): x is T => {
  return values.includes(x);
};

// Dates

export enum LongMonths {
  Jan = 'January',
  Feb = 'February',
  Mar = 'March',
  Apr = 'April',
  May = 'May',
  Jun = 'June',
  Jul = 'July',
  Aug = 'August',
  Sep = 'September',
  Oct = 'October',
  Nov = 'November',
  Dec = 'December',
}
const shortMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;
type ShortMonth =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec';
export const isShortMonth = (s: string): s is ShortMonth => {
  return inPrimitiveType(shortMonths, s);
};

export const years = [
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
  '2031',
  '2032',
  '2033',
  '2034',
  '2035',
  '2036',
  '2037',
  '2038',
  '2039',
  '2040',
] as const;
type YYYY =
  | '2020'
  | '2021'
  | '2022'
  | '2023'
  | '2024'
  | '2025'
  | '2026'
  | '2027'
  | '2028'
  | '2029'
  | '2030'
  | '2031'
  | '2032'
  | '2033'
  | '2034'
  | '2035'
  | '2036'
  | '2037'
  | '2038'
  | '2039'
  | '2040';

export const months: string[] = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
] as const;
type MM =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12';
export const days: string[] = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
] as const;
type DD =
  | '01'
  | '02'
  | '03'
  | '04'
  | '05'
  | '06'
  | '07'
  | '08'
  | '09'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18'
  | '19'
  | '20'
  | '21'
  | '22'
  | '23'
  | '24'
  | '25'
  | '26'
  | '27'
  | '28'
  | '29'
  | '30'
  | '31';

export type DateRaw = `${YYYY}-${MM}-${DD}`;
export const isDateRawType = (s: string): s is DateRaw => {
  if (!s) return false;
  const splitDate = s.split('-'); // split 2024-02-01
  if (splitDate.length !== 3) return false; // expected result [0]2024 [1]02 [02]01
  const year = splitDate[0];
  const month = splitDate[1];
  const day = splitDate[2];
  return (
    inPrimitiveType(years, year) &&
    inPrimitiveType(months, month) &&
    inPrimitiveType(days, day)
  );
};

// Locations

export interface LocationCities {
  City?: string;
  State?: string;
  Country?: string;
  Location?: string;
}

export interface ForeignPerDiem {
  Country: string;
  'Effective Date': string;
  'Footnote Reference': string | number | null;
  Location: string;
  'Location Code': number;
  Lodging: number;
  'Meals & Incidentals': number;
  'Per Diem': number;
  'Season Code': string;
  'Season End Date': string;
  'Season Start Date': string;
  __rowNum__: number;
}

const locationCategories = ['domestic', 'intl'];
export type LocationCategory = 'domestic' | 'intl';
export const isLocationCategory = (s: string): s is LocationCategory => {
  return inPrimitiveType(locationCategories, s);
};

export interface LocationForAPI {
  category: LocationCategory;
  state: string;
  city: string;
  date: DateRaw;
}

export interface LocationRow extends LocationForAPI {
  row: HTMLElement;
}

export interface RateAPIRequest {
  expensesCategory: 'lodging' | 'meals' | 'both';
  expenseDatesLocations: LocationForAPI[];
}

export interface LodgingRow {
  location: string;
  maxRate: number;
  date: DateRaw;
}

export type LocationFromList = {
  name: string;
  abbreviation: string;
  label: string;
  category: LocationCategory;
};

// Array of US States excluding OCON locations like Alaska, territories, etc.
export const LIST_STATES: LocationFromList[] = [
  {
    name: 'Alabama',
    abbreviation: 'AL',
    label: 'Alabama (AL)',
    category: 'domestic',
  },
  {
    name: 'Arizona',
    abbreviation: 'AZ',
    label: 'Arizona (AZ)',
    category: 'domestic',
  },
  {
    name: 'Arkansas',
    abbreviation: 'AR',
    label: 'Arkansas (AR)',
    category: 'domestic',
  },
  {
    name: 'California',
    abbreviation: 'CA',
    label: 'California (CA)',
    category: 'domestic',
  },
  {
    name: 'Colorado',
    abbreviation: 'CO',
    label: 'Colorado (CO)',
    category: 'domestic',
  },
  {
    name: 'Connecticut',
    abbreviation: 'CT',
    label: 'Connecticut (CT)',
    category: 'domestic',
  },
  {
    name: 'Delaware',
    abbreviation: 'DE',
    label: 'Delaware (DE)',
    category: 'domestic',
  },
  {
    name: 'District Of Columbia',
    abbreviation: 'DC',
    label: 'District Of Columbia (DC)',
    category: 'domestic',
  },
  {
    name: 'Florida',
    abbreviation: 'FL',
    label: 'Florida (FL)',
    category: 'domestic',
  },
  {
    name: 'Georgia',
    abbreviation: 'GA',
    label: 'Georgia (GA)',
    category: 'domestic',
  },
  {
    name: 'Idaho',
    abbreviation: 'ID',
    label: 'Idaho (ID)',
    category: 'domestic',
  },
  {
    name: 'Illinois',
    abbreviation: 'IL',
    label: 'Illinois (IL)',
    category: 'domestic',
  },
  {
    name: 'Indiana',
    abbreviation: 'IN',
    label: 'Indiana (IN)',
    category: 'domestic',
  },
  {
    name: 'Iowa',
    abbreviation: 'IA',
    label: 'Iowa (IA)',
    category: 'domestic',
  },
  {
    name: 'Kansas',
    abbreviation: 'KS',
    label: 'Kansas (KS)',
    category: 'domestic',
  },
  {
    name: 'Kentucky',
    abbreviation: 'KY',
    label: 'Kentucky (KY)',
    category: 'domestic',
  },
  {
    name: 'Louisiana',
    abbreviation: 'LA',
    label: 'Louisiana (LA)',
    category: 'domestic',
  },
  {
    name: 'Maine',
    abbreviation: 'ME',
    label: 'Maine (ME)',
    category: 'domestic',
  },
  {
    name: 'Maryland',
    abbreviation: 'MD',
    label: 'Maryland (MD)',
    category: 'domestic',
  },
  {
    name: 'Massachusetts',
    abbreviation: 'MA',
    label: 'Massachusetts (MA)',
    category: 'domestic',
  },
  {
    name: 'Michigan',
    abbreviation: 'MI',
    label: 'Michigan (MI)',
    category: 'domestic',
  },
  {
    name: 'Minnesota',
    abbreviation: 'MN',
    label: 'Minnesota (MN)',
    category: 'domestic',
  },
  {
    name: 'Mississippi',
    abbreviation: 'MS',
    label: 'Mississippi (MS)',
    category: 'domestic',
  },
  {
    name: 'Missouri',
    abbreviation: 'MO',
    label: 'Missouri (MO)',
    category: 'domestic',
  },
  {
    name: 'Montana',
    abbreviation: 'MT',
    label: 'Montana (MT)',
    category: 'domestic',
  },
  {
    name: 'Nebraska',
    abbreviation: 'NE',
    label: 'Nebraska (NE)',
    category: 'domestic',
  },
  {
    name: 'Nevada',
    abbreviation: 'NV',
    label: 'Nevada (NV)',
    category: 'domestic',
  },
  {
    name: 'New Hampshire',
    abbreviation: 'NH',
    label: 'New Hampshire (NH)',
    category: 'domestic',
  },
  {
    name: 'New Jersey',
    abbreviation: 'NJ',
    label: 'New Jersey (NJ)',
    category: 'domestic',
  },
  {
    name: 'New Mexico',
    abbreviation: 'NM',
    label: 'New Mexico (NM)',
    category: 'domestic',
  },
  {
    name: 'New York',
    abbreviation: 'NY',
    label: 'New York (NY)',
    category: 'domestic',
  },
  {
    name: 'North Carolina',
    abbreviation: 'NC',
    label: 'North Carolina (NC)',
    category: 'domestic',
  },
  {
    name: 'North Dakota',
    abbreviation: 'ND',
    label: 'North Dakota (ND)',
    category: 'domestic',
  },
  {
    name: 'Ohio',
    abbreviation: 'OH',
    label: 'Ohio (OH)',
    category: 'domestic',
  },
  {
    name: 'Oklahoma',
    abbreviation: 'OK',
    label: 'Oklahoma (OK)',
    category: 'domestic',
  },
  {
    name: 'Oregon',
    abbreviation: 'OR',
    label: 'Oregon (OR)',
    category: 'domestic',
  },
  {
    name: 'Pennsylvania',
    abbreviation: 'PA',
    label: 'Pennsylvania (PA)',
    category: 'domestic',
  },
  {
    name: 'Rhode Island',
    abbreviation: 'RI',
    label: 'Rhode Island (RI)',
    category: 'domestic',
  },
  {
    name: 'South Carolina',
    abbreviation: 'SC',
    label: 'South Carolina (SC)',
    category: 'domestic',
  },
  {
    name: 'South Dakota',
    abbreviation: 'SD',
    label: 'South Dakota (SD)',
    category: 'domestic',
  },
  {
    name: 'Tennessee',
    abbreviation: 'TN',
    label: 'Tennessee (TN)',
    category: 'domestic',
  },
  {
    name: 'Texas',
    abbreviation: 'TX',
    label: 'Texas (TX)',
    category: 'domestic',
  },
  {
    name: 'Utah',
    abbreviation: 'UT',
    label: 'Utah (UT)',
    category: 'domestic',
  },
  {
    name: 'Vermont',
    abbreviation: 'VT',
    label: 'Vermont (VT)',
    category: 'domestic',
  },
  {
    name: 'Virginia',
    abbreviation: 'VA',
    label: 'Virginia (VA)',
    category: 'domestic',
  },
  {
    name: 'Washington',
    abbreviation: 'WA',
    label: 'Washington (WA)',
    category: 'domestic',
  },
  {
    name: 'West Virginia',
    abbreviation: 'WV',
    label: 'West Virginia (WV)',
    category: 'domestic',
  },
  {
    name: 'Wisconsin',
    abbreviation: 'WI',
    label: 'Wisconsin (WI)',
    category: 'domestic',
  },
  {
    name: 'Wyoming',
    abbreviation: 'WY',
    label: 'Wyoming (WY)',
    category: 'domestic',
  },

  {
    label: 'ARUBA (ABW)',
    category: 'intl',
    name: 'ARUBA',
    abbreviation: 'ABW',
  },
  {
    label: 'AFGHANISTAN (AFG)',
    category: 'intl',
    name: 'AFGHANISTAN',
    abbreviation: 'AFG',
  },
  {
    label: 'ANGOLA (AGO)',
    category: 'intl',
    name: 'ANGOLA',
    abbreviation: 'AGO',
  },
  {
    label: 'ANGUILLA (AIA)',
    category: 'intl',
    name: 'ANGUILLA',
    abbreviation: 'AIA',
  },
  {
    label: 'ALASKA (AK)',
    category: 'intl',
    name: 'ALASKA',
    abbreviation: 'AK',
  },
  {
    label: 'ALBANIA (ALB)',
    category: 'intl',
    name: 'ALBANIA',
    abbreviation: 'ALB',
  },
  {
    label: 'ALL PLACES NOT LISTED (ALL)',
    category: 'intl',
    name: 'ALL PLACES NOT LISTED',
    abbreviation: 'ALL',
  },
  {
    label: 'ANDORRA (AND)',
    category: 'intl',
    name: 'ANDORRA',
    abbreviation: 'AND',
  },
  {
    label: 'UNITED ARAB EMIRATES (ARE)',
    category: 'intl',
    name: 'UNITED ARAB EMIRATES',
    abbreviation: 'ARE',
  },
  {
    label: 'ARGENTINA (ARG)',
    category: 'intl',
    name: 'ARGENTINA',
    abbreviation: 'ARG',
  },
  {
    label: 'ARMENIA (ARM)',
    category: 'intl',
    name: 'ARMENIA',
    abbreviation: 'ARM',
  },
  {
    label: 'AMERICAN SAMOA (AS)',
    category: 'intl',
    name: 'AMERICAN SAMOA',
    abbreviation: 'AS',
  },
  {
    label: 'ASCENSION ISLAND (ASC)',
    category: 'intl',
    name: 'ASCENSION ISLAND',
    abbreviation: 'ASC',
  },
  {
    label: 'ANTARCTICA (ATA)',
    category: 'intl',
    name: 'ANTARCTICA',
    abbreviation: 'ATA',
  },
  {
    label: 'ANTIGUA AND BARBUDA (ATG)',
    category: 'intl',
    name: 'ANTIGUA AND BARBUDA',
    abbreviation: 'ATG',
  },
  {
    label: 'AUSTRALIA (AUS)',
    category: 'intl',
    name: 'AUSTRALIA',
    abbreviation: 'AUS',
  },
  {
    label: 'AUSTRIA (AUT)',
    category: 'intl',
    name: 'AUSTRIA',
    abbreviation: 'AUT',
  },
  {
    label: 'AZERBAIJAN (AZE)',
    category: 'intl',
    name: 'AZERBAIJAN',
    abbreviation: 'AZE',
  },
  {
    label: 'BURUNDI (BDI)',
    category: 'intl',
    name: 'BURUNDI',
    abbreviation: 'BDI',
  },
  {
    label: 'BELGIUM (BEL)',
    category: 'intl',
    name: 'BELGIUM',
    abbreviation: 'BEL',
  },
  {
    label: 'BENIN (BEN)',
    category: 'intl',
    name: 'BENIN',
    abbreviation: 'BEN',
  },
  {
    label: 'BONAIRE, SINT EUSTATIUS, AND SABA (BES)',
    category: 'intl',
    name: 'BONAIRE, SINT EUSTATIUS, AND SABA',
    abbreviation: 'BES',
  },
  {
    label: 'BURKINA FASO (BFA)',
    category: 'intl',
    name: 'BURKINA FASO',
    abbreviation: 'BFA',
  },
  {
    label: 'BANGLADESH (BGD)',
    category: 'intl',
    name: 'BANGLADESH',
    abbreviation: 'BGD',
  },
  {
    label: 'BULGARIA (BGR)',
    category: 'intl',
    name: 'BULGARIA',
    abbreviation: 'BGR',
  },
  {
    label: 'BAHRAIN (BHR)',
    category: 'intl',
    name: 'BAHRAIN',
    abbreviation: 'BHR',
  },
  {
    label: 'BAHAMAS, THE (BHS)',
    category: 'intl',
    name: 'BAHAMAS, THE',
    abbreviation: 'BHS',
  },
  {
    label: 'BOSNIA AND HERZEGOVINA (BIH)',
    category: 'intl',
    name: 'BOSNIA AND HERZEGOVINA',
    abbreviation: 'BIH',
  },
  {
    label: 'BELARUS (BLR)',
    category: 'intl',
    name: 'BELARUS',
    abbreviation: 'BLR',
  },
  {
    label: 'BELIZE (BLZ)',
    category: 'intl',
    name: 'BELIZE',
    abbreviation: 'BLZ',
  },
  {
    label: 'BERMUDA (BMU)',
    category: 'intl',
    name: 'BERMUDA',
    abbreviation: 'BMU',
  },
  {
    label: 'BOLIVIA (BOL)',
    category: 'intl',
    name: 'BOLIVIA',
    abbreviation: 'BOL',
  },
  {
    label: 'BRAZIL (BRA)',
    category: 'intl',
    name: 'BRAZIL',
    abbreviation: 'BRA',
  },
  {
    label: 'BARBADOS (BRB)',
    category: 'intl',
    name: 'BARBADOS',
    abbreviation: 'BRB',
  },
  {
    label: 'BRUNEI (BRN)',
    category: 'intl',
    name: 'BRUNEI',
    abbreviation: 'BRN',
  },
  {
    label: 'BHUTAN (BTN)',
    category: 'intl',
    name: 'BHUTAN',
    abbreviation: 'BTN',
  },
  {
    label: 'BOTSWANA (BWA)',
    category: 'intl',
    name: 'BOTSWANA',
    abbreviation: 'BWA',
  },
  {
    label: 'CENTRAL AFRICAN REPUBLIC (CAF)',
    category: 'intl',
    name: 'CENTRAL AFRICAN REPUBLIC',
    abbreviation: 'CAF',
  },
  {
    label: 'CANADA (CAN)',
    category: 'intl',
    name: 'CANADA',
    abbreviation: 'CAN',
  },
  {
    label: 'COCOS (KEELING) ISLANDS (CCK)',
    category: 'intl',
    name: 'COCOS (KEELING) ISLANDS',
    abbreviation: 'CCK',
  },
  {
    label: 'SWITZERLAND (CHE)',
    category: 'intl',
    name: 'SWITZERLAND',
    abbreviation: 'CHE',
  },
  {
    label: 'CHILE (CHL)',
    category: 'intl',
    name: 'CHILE',
    abbreviation: 'CHL',
  },
  {
    label: 'CHINA (CHN)',
    category: 'intl',
    name: 'CHINA',
    abbreviation: 'CHN',
  },
  {
    label: "COTE D'IVOIRE (CIV)",
    category: 'intl',
    name: "COTE D'IVOIRE",
    abbreviation: 'CIV',
  },
  {
    label: 'CAMEROON (CMR)',
    category: 'intl',
    name: 'CAMEROON',
    abbreviation: 'CMR',
  },
  {
    label: 'DEMOCRATIC REPUBLIC OF THE CONGO (COD)',
    category: 'intl',
    name: 'DEMOCRATIC REPUBLIC OF THE CONGO',
    abbreviation: 'COD',
  },
  {
    label: 'REPUBLIC OF THE CONGO (COG)',
    category: 'intl',
    name: 'REPUBLIC OF THE CONGO',
    abbreviation: 'COG',
  },
  {
    label: 'COOK ISLANDS (COK)',
    category: 'intl',
    name: 'COOK ISLANDS',
    abbreviation: 'COK',
  },
  {
    label: 'COLOMBIA (COL)',
    category: 'intl',
    name: 'COLOMBIA',
    abbreviation: 'COL',
  },
  {
    label: 'COMOROS (COM)',
    category: 'intl',
    name: 'COMOROS',
    abbreviation: 'COM',
  },
  {
    label: 'CABO VERDE (CPV)',
    category: 'intl',
    name: 'CABO VERDE',
    abbreviation: 'CPV',
  },
  {
    label: 'COSTA RICA (CRI)',
    category: 'intl',
    name: 'COSTA RICA',
    abbreviation: 'CRI',
  },
  {
    label: 'CUBA (CUB)',
    category: 'intl',
    name: 'CUBA',
    abbreviation: 'CUB',
  },
  {
    label: 'CURACAO (CUW)',
    category: 'intl',
    name: 'CURACAO',
    abbreviation: 'CUW',
  },
  {
    label: 'CAYMAN ISLANDS (CYM)',
    category: 'intl',
    name: 'CAYMAN ISLANDS',
    abbreviation: 'CYM',
  },
  {
    label: 'CYPRUS (CYP)',
    category: 'intl',
    name: 'CYPRUS',
    abbreviation: 'CYP',
  },
  {
    label: 'CZECH REPUBLIC (CZE)',
    category: 'intl',
    name: 'CZECH REPUBLIC',
    abbreviation: 'CZE',
  },
  {
    label: 'DUTCH CARIBBEAN (DCR)',
    category: 'intl',
    name: 'DUTCH CARIBBEAN',
    abbreviation: 'DCR',
  },
  {
    label: 'GERMANY (DEU)',
    category: 'intl',
    name: 'GERMANY',
    abbreviation: 'DEU',
  },
  {
    label: 'DJIBOUTI (DJI)',
    category: 'intl',
    name: 'DJIBOUTI',
    abbreviation: 'DJI',
  },
  {
    label: 'DOMINICA (DMA)',
    category: 'intl',
    name: 'DOMINICA',
    abbreviation: 'DMA',
  },
  {
    label: 'DENMARK (DNK)',
    category: 'intl',
    name: 'DENMARK',
    abbreviation: 'DNK',
  },
  {
    label: 'DOMINICAN REPUBLIC (DOM)',
    category: 'intl',
    name: 'DOMINICAN REPUBLIC',
    abbreviation: 'DOM',
  },
  {
    label: 'ALGERIA (DZA)',
    category: 'intl',
    name: 'ALGERIA',
    abbreviation: 'DZA',
  },
  {
    label: 'ECUADOR (ECU)',
    category: 'intl',
    name: 'ECUADOR',
    abbreviation: 'ECU',
  },
  {
    label: 'EGYPT (EGY)',
    category: 'intl',
    name: 'EGYPT',
    abbreviation: 'EGY',
  },
  {
    label: 'ERITREA (ERI)',
    category: 'intl',
    name: 'ERITREA',
    abbreviation: 'ERI',
  },
  {
    label: 'SPAIN (ESP)',
    category: 'intl',
    name: 'SPAIN',
    abbreviation: 'ESP',
  },
  {
    label: 'ESTONIA (EST)',
    category: 'intl',
    name: 'ESTONIA',
    abbreviation: 'EST',
  },
  {
    label: 'ETHIOPIA (ETH)',
    category: 'intl',
    name: 'ETHIOPIA',
    abbreviation: 'ETH',
  },
  {
    label: 'FINLAND (FIN)',
    category: 'intl',
    name: 'FINLAND',
    abbreviation: 'FIN',
  },
  {
    label: 'FIJI (FJI)',
    category: 'intl',
    name: 'FIJI',
    abbreviation: 'FJI',
  },
  {
    label: 'FALKLAND ISLANDS (ISLAS MALVINAS) (FLK)',
    category: 'intl',
    name: 'FALKLAND ISLANDS (ISLAS MALVINAS)',
    abbreviation: 'FLK',
  },
  {
    label: 'FRANCE (FRA)',
    category: 'intl',
    name: 'FRANCE',
    abbreviation: 'FRA',
  },
  {
    label: 'FAROE ISLANDS (FRO)',
    category: 'intl',
    name: 'FAROE ISLANDS',
    abbreviation: 'FRO',
  },
  {
    label: 'MICRONESIA, FEDERATED STATES OF (FSM)',
    category: 'intl',
    name: 'MICRONESIA, FEDERATED STATES OF',
    abbreviation: 'FSM',
  },
  {
    label: 'GABON (GAB)',
    category: 'intl',
    name: 'GABON',
    abbreviation: 'GAB',
  },
  {
    label: 'UNITED KINGDOM (GBR)',
    category: 'intl',
    name: 'UNITED KINGDOM',
    abbreviation: 'GBR',
  },
  {
    label: 'GEORGIA (GEO)',
    category: 'intl',
    name: 'GEORGIA',
    abbreviation: 'GEO',
  },
  {
    label: 'GHANA (GHA)',
    category: 'intl',
    name: 'GHANA',
    abbreviation: 'GHA',
  },
  {
    label: 'GIBRALTAR (GIB)',
    category: 'intl',
    name: 'GIBRALTAR',
    abbreviation: 'GIB',
  },
  {
    label: 'GUINEA (GIN)',
    category: 'intl',
    name: 'GUINEA',
    abbreviation: 'GIN',
  },
  {
    label: 'GUADELOUPE (GLP)',
    category: 'intl',
    name: 'GUADELOUPE',
    abbreviation: 'GLP',
  },
  {
    label: 'GAMBIA, THE (GMB)',
    category: 'intl',
    name: 'GAMBIA, THE',
    abbreviation: 'GMB',
  },
  {
    label: 'GUINEA-BISSAU (GNB)',
    category: 'intl',
    name: 'GUINEA-BISSAU',
    abbreviation: 'GNB',
  },
  {
    label: 'EQUATORIAL GUINEA (GNQ)',
    category: 'intl',
    name: 'EQUATORIAL GUINEA',
    abbreviation: 'GNQ',
  },
  {
    label: 'GREECE (GRC)',
    category: 'intl',
    name: 'GREECE',
    abbreviation: 'GRC',
  },
  {
    label: 'GRENADA (GRD)',
    category: 'intl',
    name: 'GRENADA',
    abbreviation: 'GRD',
  },
  {
    label: 'GREENLAND (GRL)',
    category: 'intl',
    name: 'GREENLAND',
    abbreviation: 'GRL',
  },
  {
    label: 'GUATEMALA (GTM)',
    category: 'intl',
    name: 'GUATEMALA',
    abbreviation: 'GTM',
  },
  {
    label: 'GUAM (GU)',
    category: 'intl',
    name: 'GUAM',
    abbreviation: 'GU',
  },
  {
    label: 'FRENCH GUIANA (GUF)',
    category: 'intl',
    name: 'FRENCH GUIANA',
    abbreviation: 'GUF',
  },
  {
    label: 'GUYANA (GUY)',
    category: 'intl',
    name: 'GUYANA',
    abbreviation: 'GUY',
  },
  {
    label: 'HAWAII (HI)',
    category: 'intl',
    name: 'HAWAII',
    abbreviation: 'HI',
  },
  {
    label: 'HONG KONG (HKG)',
    category: 'intl',
    name: 'HONG KONG',
    abbreviation: 'HKG',
  },
  {
    label: 'HONDURAS (HND)',
    category: 'intl',
    name: 'HONDURAS',
    abbreviation: 'HND',
  },
  {
    label: 'CROATIA (HRV)',
    category: 'intl',
    name: 'CROATIA',
    abbreviation: 'HRV',
  },
  {
    label: 'HAITI (HTI)',
    category: 'intl',
    name: 'HAITI',
    abbreviation: 'HTI',
  },
  {
    label: 'HUNGARY (HUN)',
    category: 'intl',
    name: 'HUNGARY',
    abbreviation: 'HUN',
  },
  {
    label: 'INDONESIA (IDN)',
    category: 'intl',
    name: 'INDONESIA',
    abbreviation: 'IDN',
  },
  {
    label: 'INDIA (IND)',
    category: 'intl',
    name: 'INDIA',
    abbreviation: 'IND',
  },
  {
    label: 'CHAGOS ARCHIPELAGO (IOT)',
    category: 'intl',
    name: 'CHAGOS ARCHIPELAGO',
    abbreviation: 'IOT',
  },
  {
    label: 'IRELAND (IRL)',
    category: 'intl',
    name: 'IRELAND',
    abbreviation: 'IRL',
  },
  {
    label: 'IRAN (IRN)',
    category: 'intl',
    name: 'IRAN',
    abbreviation: 'IRN',
  },
  {
    label: 'IRAQ (IRQ)',
    category: 'intl',
    name: 'IRAQ',
    abbreviation: 'IRQ',
  },
  {
    label: 'ICELAND (ISL)',
    category: 'intl',
    name: 'ICELAND',
    abbreviation: 'ISL',
  },
  {
    label: 'ISRAEL (ISR)',
    category: 'intl',
    name: 'ISRAEL',
    abbreviation: 'ISR',
  },
  {
    label: 'ITALY (ITA)',
    category: 'intl',
    name: 'ITALY',
    abbreviation: 'ITA',
  },
  {
    label: 'JAMAICA (JAM)',
    category: 'intl',
    name: 'JAMAICA',
    abbreviation: 'JAM',
  },
  {
    label: 'JORDAN (JOR)',
    category: 'intl',
    name: 'JORDAN',
    abbreviation: 'JOR',
  },
  {
    label: 'JAPAN (JPN)',
    category: 'intl',
    name: 'JAPAN',
    abbreviation: 'JPN',
  },
  {
    label: 'KAZAKHSTAN (KAZ)',
    category: 'intl',
    name: 'KAZAKHSTAN',
    abbreviation: 'KAZ',
  },
  {
    label: 'KENYA (KEN)',
    category: 'intl',
    name: 'KENYA',
    abbreviation: 'KEN',
  },
  {
    label: 'KYRGYZSTAN (KGZ)',
    category: 'intl',
    name: 'KYRGYZSTAN',
    abbreviation: 'KGZ',
  },
  {
    label: 'CAMBODIA (KHM)',
    category: 'intl',
    name: 'CAMBODIA',
    abbreviation: 'KHM',
  },
  {
    label: 'KIRIBATI (KIR)',
    category: 'intl',
    name: 'KIRIBATI',
    abbreviation: 'KIR',
  },
  {
    label: 'SAINT KITTS AND NEVIS (KNA)',
    category: 'intl',
    name: 'SAINT KITTS AND NEVIS',
    abbreviation: 'KNA',
  },
  {
    label: 'KOREA, SOUTH (KOR)',
    category: 'intl',
    name: 'KOREA, SOUTH',
    abbreviation: 'KOR',
  },
  {
    label: 'KUWAIT (KWT)',
    category: 'intl',
    name: 'KUWAIT',
    abbreviation: 'KWT',
  },
  {
    label: 'LAOS (LAO)',
    category: 'intl',
    name: 'LAOS',
    abbreviation: 'LAO',
  },
  {
    label: 'LEBANON (LBN)',
    category: 'intl',
    name: 'LEBANON',
    abbreviation: 'LBN',
  },
  {
    label: 'LIBERIA (LBR)',
    category: 'intl',
    name: 'LIBERIA',
    abbreviation: 'LBR',
  },
  {
    label: 'LIBYA (LBY)',
    category: 'intl',
    name: 'LIBYA',
    abbreviation: 'LBY',
  },
  {
    label: 'ST LUCIA (LCA)',
    category: 'intl',
    name: 'ST LUCIA',
    abbreviation: 'LCA',
  },
  {
    label: 'LIECHTENSTEIN (LIE)',
    category: 'intl',
    name: 'LIECHTENSTEIN',
    abbreviation: 'LIE',
  },
  {
    label: 'SRI LANKA (LKA)',
    category: 'intl',
    name: 'SRI LANKA',
    abbreviation: 'LKA',
  },
  {
    label: 'LESOTHO (LSO)',
    category: 'intl',
    name: 'LESOTHO',
    abbreviation: 'LSO',
  },
  {
    label: 'LITHUANIA (LTU)',
    category: 'intl',
    name: 'LITHUANIA',
    abbreviation: 'LTU',
  },
  {
    label: 'LUXEMBOURG (LUX)',
    category: 'intl',
    name: 'LUXEMBOURG',
    abbreviation: 'LUX',
  },
  {
    label: 'LATVIA (LVA)',
    category: 'intl',
    name: 'LATVIA',
    abbreviation: 'LVA',
  },
  {
    label: 'MACAU (MAC)',
    category: 'intl',
    name: 'MACAU',
    abbreviation: 'MAC',
  },
  {
    label: 'MOROCCO (MAR)',
    category: 'intl',
    name: 'MOROCCO',
    abbreviation: 'MAR',
  },
  {
    label: 'MONACO (MCO)',
    category: 'intl',
    name: 'MONACO',
    abbreviation: 'MCO',
  },
  {
    label: 'MOLDOVA (MDA)',
    category: 'intl',
    name: 'MOLDOVA',
    abbreviation: 'MDA',
  },
  {
    label: 'MADAGASCAR (MDG)',
    category: 'intl',
    name: 'MADAGASCAR',
    abbreviation: 'MDG',
  },
  {
    label: 'MALDIVES (MDV)',
    category: 'intl',
    name: 'MALDIVES',
    abbreviation: 'MDV',
  },
  {
    label: 'MEXICO (MEX)',
    category: 'intl',
    name: 'MEXICO',
    abbreviation: 'MEX',
  },
  {
    label: 'MARSHALL ISLANDS (MHL)',
    category: 'intl',
    name: 'MARSHALL ISLANDS',
    abbreviation: 'MHL',
  },
  {
    label: 'NORTH MACEDONIA (MKD)',
    category: 'intl',
    name: 'NORTH MACEDONIA',
    abbreviation: 'MKD',
  },
  {
    label: 'MALI (MLI)',
    category: 'intl',
    name: 'MALI',
    abbreviation: 'MLI',
  },
  {
    label: 'MALTA (MLT)',
    category: 'intl',
    name: 'MALTA',
    abbreviation: 'MLT',
  },
  {
    label: 'BURMA (MMR)',
    category: 'intl',
    name: 'BURMA',
    abbreviation: 'MMR',
  },
  {
    label: 'MONTENEGRO (MNE)',
    category: 'intl',
    name: 'MONTENEGRO',
    abbreviation: 'MNE',
  },
  {
    label: 'MONGOLIA (MNG)',
    category: 'intl',
    name: 'MONGOLIA',
    abbreviation: 'MNG',
  },
  {
    label: 'MOZAMBIQUE (MOZ)',
    category: 'intl',
    name: 'MOZAMBIQUE',
    abbreviation: 'MOZ',
  },
  {
    label: 'NORTHERN MARIANA ISLANDS (MP)',
    category: 'intl',
    name: 'NORTHERN MARIANA ISLANDS',
    abbreviation: 'MP',
  },
  {
    label: 'MAURITANIA (MRT)',
    category: 'intl',
    name: 'MAURITANIA',
    abbreviation: 'MRT',
  },
  {
    label: 'MONTSERRAT (MSR)',
    category: 'intl',
    name: 'MONTSERRAT',
    abbreviation: 'MSR',
  },
  {
    label: 'MARTINIQUE (MTQ)',
    category: 'intl',
    name: 'MARTINIQUE',
    abbreviation: 'MTQ',
  },
  {
    label: 'MAURITIUS (MUS)',
    category: 'intl',
    name: 'MAURITIUS',
    abbreviation: 'MUS',
  },
  {
    label: 'MALAWI (MWI)',
    category: 'intl',
    name: 'MALAWI',
    abbreviation: 'MWI',
  },
  {
    label: 'MALAYSIA (MYS)',
    category: 'intl',
    name: 'MALAYSIA',
    abbreviation: 'MYS',
  },
  {
    label: 'MAYOTTE (MYT)',
    category: 'intl',
    name: 'MAYOTTE',
    abbreviation: 'MYT',
  },
  {
    label: 'NAMIBIA (NAM)',
    category: 'intl',
    name: 'NAMIBIA',
    abbreviation: 'NAM',
  },
  {
    label: 'NEW CALEDONIA (NCL)',
    category: 'intl',
    name: 'NEW CALEDONIA',
    abbreviation: 'NCL',
  },
  {
    label: 'NIGER (NER)',
    category: 'intl',
    name: 'NIGER',
    abbreviation: 'NER',
  },
  {
    label: 'NIGERIA (NGA)',
    category: 'intl',
    name: 'NIGERIA',
    abbreviation: 'NGA',
  },
  {
    label: 'NICARAGUA (NIC)',
    category: 'intl',
    name: 'NICARAGUA',
    abbreviation: 'NIC',
  },
  {
    label: 'NIUE (NIU)',
    category: 'intl',
    name: 'NIUE',
    abbreviation: 'NIU',
  },
  {
    label: 'NETHERLANDS (NLD)',
    category: 'intl',
    name: 'NETHERLANDS',
    abbreviation: 'NLD',
  },
  {
    label: 'NORWAY (NOR)',
    category: 'intl',
    name: 'NORWAY',
    abbreviation: 'NOR',
  },
  {
    label: 'NEPAL (NPL)',
    category: 'intl',
    name: 'NEPAL',
    abbreviation: 'NPL',
  },
  {
    label: 'NAURU (NRU)',
    category: 'intl',
    name: 'NAURU',
    abbreviation: 'NRU',
  },
  {
    label: 'NEW ZEALAND (NZL)',
    category: 'intl',
    name: 'NEW ZEALAND',
    abbreviation: 'NZL',
  },
  {
    label: 'OMAN (OMN)',
    category: 'intl',
    name: 'OMAN',
    abbreviation: 'OMN',
  },
  {
    label: 'OTHER FOREIGN LOCALITIES (OTH)',
    category: 'intl',
    name: 'OTHER FOREIGN LOCALITIES',
    abbreviation: 'OTH',
  },
  {
    label: 'PAKISTAN (PAK)',
    category: 'intl',
    name: 'PAKISTAN',
    abbreviation: 'PAK',
  },
  {
    label: 'PANAMA (PAN)',
    category: 'intl',
    name: 'PANAMA',
    abbreviation: 'PAN',
  },
  {
    label: 'PERU (PER)',
    category: 'intl',
    name: 'PERU',
    abbreviation: 'PER',
  },
  {
    label: 'PHILIPPINES (PHL)',
    category: 'intl',
    name: 'PHILIPPINES',
    abbreviation: 'PHL',
  },
  {
    label: 'PALAU (PLW)',
    category: 'intl',
    name: 'PALAU',
    abbreviation: 'PLW',
  },
  {
    label: 'PAPUA NEW GUINEA (PNG)',
    category: 'intl',
    name: 'PAPUA NEW GUINEA',
    abbreviation: 'PNG',
  },
  {
    label: 'POLAND (POL)',
    category: 'intl',
    name: 'POLAND',
    abbreviation: 'POL',
  },
  {
    label: 'PUERTO RICO (PR)',
    category: 'intl',
    name: 'PUERTO RICO',
    abbreviation: 'PR',
  },
  {
    label: "DEM. PEOPLE'S REPUBLIC OF KOREA (PRK)",
    category: 'intl',
    name: "DEM. PEOPLE'S REPUBLIC OF KOREA",
    abbreviation: 'PRK',
  },
  {
    label: 'PORTUGAL (PRT)',
    category: 'intl',
    name: 'PORTUGAL',
    abbreviation: 'PRT',
  },
  {
    label: 'PARAGUAY (PRY)',
    category: 'intl',
    name: 'PARAGUAY',
    abbreviation: 'PRY',
  },
  {
    label: 'FRENCH POLYNESIA (PYF)',
    category: 'intl',
    name: 'FRENCH POLYNESIA',
    abbreviation: 'PYF',
  },
  {
    label: 'QATAR (QAT)',
    category: 'intl',
    name: 'QATAR',
    abbreviation: 'QAT',
  },
  {
    label: 'MIDWAY ISLANDS (QM)',
    category: 'intl',
    name: 'MIDWAY ISLANDS',
    abbreviation: 'QM',
  },
  {
    label: 'WAKE ISLAND (QW)',
    category: 'intl',
    name: 'WAKE ISLAND',
    abbreviation: 'QW',
  },
  {
    label: 'RESERVE COMPONENT (RES)',
    category: 'intl',
    name: 'RESERVE COMPONENT',
    abbreviation: 'RES',
  },
  {
    label: 'REUNION (REU)',
    category: 'intl',
    name: 'REUNION',
    abbreviation: 'REU',
  },
  {
    label: 'ROMANIA (ROU)',
    category: 'intl',
    name: 'ROMANIA',
    abbreviation: 'ROU',
  },
  {
    label: 'RUSSIA (RUS)',
    category: 'intl',
    name: 'RUSSIA',
    abbreviation: 'RUS',
  },
  {
    label: 'RWANDA (RWA)',
    category: 'intl',
    name: 'RWANDA',
    abbreviation: 'RWA',
  },
  {
    label: 'SAUDI ARABIA (SAU)',
    category: 'intl',
    name: 'SAUDI ARABIA',
    abbreviation: 'SAU',
  },
  {
    label: 'SUDAN (SDN)',
    category: 'intl',
    name: 'SUDAN',
    abbreviation: 'SDN',
  },
  {
    label: 'SENEGAL (SEN)',
    category: 'intl',
    name: 'SENEGAL',
    abbreviation: 'SEN',
  },
  {
    label: 'SINGAPORE (SGP)',
    category: 'intl',
    name: 'SINGAPORE',
    abbreviation: 'SGP',
  },
  {
    label: 'SAINT HELENA (SHN)',
    category: 'intl',
    name: 'SAINT HELENA',
    abbreviation: 'SHN',
  },
  {
    label: 'SOLOMON ISLANDS (SLB)',
    category: 'intl',
    name: 'SOLOMON ISLANDS',
    abbreviation: 'SLB',
  },
  {
    label: 'SIERRA LEONE (SLE)',
    category: 'intl',
    name: 'SIERRA LEONE',
    abbreviation: 'SLE',
  },
  {
    label: 'EL SALVADOR (SLV)',
    category: 'intl',
    name: 'EL SALVADOR',
    abbreviation: 'SLV',
  },
  {
    label: 'SAN MARINO (SMR)',
    category: 'intl',
    name: 'SAN MARINO',
    abbreviation: 'SMR',
  },
  {
    label: 'SOMALIA (SOM)',
    category: 'intl',
    name: 'SOMALIA',
    abbreviation: 'SOM',
  },
  {
    label: 'SERBIA (SRB)',
    category: 'intl',
    name: 'SERBIA',
    abbreviation: 'SRB',
  },
  {
    label: 'SOUTH SUDAN (SSD)',
    category: 'intl',
    name: 'SOUTH SUDAN',
    abbreviation: 'SSD',
  },
  {
    label: 'SAO TOME AND PRINCIPE (STP)',
    category: 'intl',
    name: 'SAO TOME AND PRINCIPE',
    abbreviation: 'STP',
  },
  {
    label: 'SURINAME (SUR)',
    category: 'intl',
    name: 'SURINAME',
    abbreviation: 'SUR',
  },
  {
    label: 'SLOVAKIA (SVK)',
    category: 'intl',
    name: 'SLOVAKIA',
    abbreviation: 'SVK',
  },
  {
    label: 'SLOVENIA (SVN)',
    category: 'intl',
    name: 'SLOVENIA',
    abbreviation: 'SVN',
  },
  {
    label: 'SWEDEN (SWE)',
    category: 'intl',
    name: 'SWEDEN',
    abbreviation: 'SWE',
  },
  {
    label: 'ESWATINI (SWZ)',
    category: 'intl',
    name: 'ESWATINI',
    abbreviation: 'SWZ',
  },
  {
    label: 'SINT MAARTEN (SXM)',
    category: 'intl',
    name: 'SINT MAARTEN',
    abbreviation: 'SXM',
  },
  {
    label: 'SEYCHELLES (SYC)',
    category: 'intl',
    name: 'SEYCHELLES',
    abbreviation: 'SYC',
  },
  {
    label: 'SYRIA (SYR)',
    category: 'intl',
    name: 'SYRIA',
    abbreviation: 'SYR',
  },
  {
    label: 'TURKS AND CAICOS ISLANDS (TCA)',
    category: 'intl',
    name: 'TURKS AND CAICOS ISLANDS',
    abbreviation: 'TCA',
  },
  {
    label: 'CHAD (TCD)',
    category: 'intl',
    name: 'CHAD',
    abbreviation: 'TCD',
  },
  {
    label: 'TOGO (TGO)',
    category: 'intl',
    name: 'TOGO',
    abbreviation: 'TGO',
  },
  {
    label: 'THAILAND (THA)',
    category: 'intl',
    name: 'THAILAND',
    abbreviation: 'THA',
  },
  {
    label: 'TAJIKISTAN (TJK)',
    category: 'intl',
    name: 'TAJIKISTAN',
    abbreviation: 'TJK',
  },
  {
    label: 'TOKELAU (TKL)',
    category: 'intl',
    name: 'TOKELAU',
    abbreviation: 'TKL',
  },
  {
    label: 'TURKMENISTAN (TKM)',
    category: 'intl',
    name: 'TURKMENISTAN',
    abbreviation: 'TKM',
  },
  {
    label: 'TIMOR-LESTE (TLS)',
    category: 'intl',
    name: 'TIMOR-LESTE',
    abbreviation: 'TLS',
  },
  {
    label: 'TONGA (TON)',
    category: 'intl',
    name: 'TONGA',
    abbreviation: 'TON',
  },
  {
    label: 'TRINIDAD AND TOBAGO (TTO)',
    category: 'intl',
    name: 'TRINIDAD AND TOBAGO',
    abbreviation: 'TTO',
  },
  {
    label: 'TUNISIA (TUN)',
    category: 'intl',
    name: 'TUNISIA',
    abbreviation: 'TUN',
  },
  {
    label: 'TURKEY (TUR)',
    category: 'intl',
    name: 'TURKEY',
    abbreviation: 'TUR',
  },
  {
    label: 'TUVALU (TUV)',
    category: 'intl',
    name: 'TUVALU',
    abbreviation: 'TUV',
  },
  {
    label: 'TAIWAN (TWN)',
    category: 'intl',
    name: 'TAIWAN',
    abbreviation: 'TWN',
  },
  {
    label: 'TANZANIA (TZA)',
    category: 'intl',
    name: 'TANZANIA',
    abbreviation: 'TZA',
  },
  {
    label: 'UGANDA (UGA)',
    category: 'intl',
    name: 'UGANDA',
    abbreviation: 'UGA',
  },
  {
    label: 'UKRAINE (UKR)',
    category: 'intl',
    name: 'UKRAINE',
    abbreviation: 'UKR',
  },
  {
    label: 'URUGUAY (URY)',
    category: 'intl',
    name: 'URUGUAY',
    abbreviation: 'URY',
  },
  {
    label: 'UZBEKISTAN (UZB)',
    category: 'intl',
    name: 'UZBEKISTAN',
    abbreviation: 'UZB',
  },
  {
    label: 'HOLY SEE (VAT)',
    category: 'intl',
    name: 'HOLY SEE',
    abbreviation: 'VAT',
  },
  {
    label: 'SAINT VINCENT AND THE GRENADINES (VCT)',
    category: 'intl',
    name: 'SAINT VINCENT AND THE GRENADINES',
    abbreviation: 'VCT',
  },
  {
    label: 'VENEZUELA (VEN)',
    category: 'intl',
    name: 'VENEZUELA',
    abbreviation: 'VEN',
  },
  {
    label: 'VIRGIN ISLANDS, BRITISH (VGB)',
    category: 'intl',
    name: 'VIRGIN ISLANDS, BRITISH',
    abbreviation: 'VGB',
  },
  {
    label: 'VIRGIN ISLANDS (U.S.) (VI)',
    category: 'intl',
    name: 'VIRGIN ISLANDS (U.S.)',
    abbreviation: 'VI',
  },
  {
    label: 'VIETNAM (VNM)',
    category: 'intl',
    name: 'VIETNAM',
    abbreviation: 'VNM',
  },
  {
    label: 'VANUATU (VUT)',
    category: 'intl',
    name: 'VANUATU',
    abbreviation: 'VUT',
  },
  {
    label: 'WALLIS AND FUTUNA (WLF)',
    category: 'intl',
    name: 'WALLIS AND FUTUNA',
    abbreviation: 'WLF',
  },
  {
    label: 'SAMOA (WSM)',
    category: 'intl',
    name: 'SAMOA',
    abbreviation: 'WSM',
  },
  {
    label: 'KOSOVO (XKS)',
    category: 'intl',
    name: 'KOSOVO',
    abbreviation: 'XKS',
  },
  {
    label: 'YEMEN (YEM)',
    category: 'intl',
    name: 'YEMEN',
    abbreviation: 'YEM',
  },
  {
    label: 'SOUTH AFRICA (ZAF)',
    category: 'intl',
    name: 'SOUTH AFRICA',
    abbreviation: 'ZAF',
  },
  {
    label: 'ZAMBIA (ZMB)',
    category: 'intl',
    name: 'ZAMBIA',
    abbreviation: 'ZMB',
  },
  {
    label: 'ZIMBABWE (ZWE)',
    category: 'intl',
    name: 'ZIMBABWE',
    abbreviation: 'ZWE',
  },
] as const;
