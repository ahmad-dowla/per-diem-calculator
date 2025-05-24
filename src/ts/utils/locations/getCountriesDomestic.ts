// Types
import type { Location } from '../../types/locations';
import type { DateRaw } from '../../types/dates';
import type { RateLodging } from '../../types/expenses';

// Utils
import { fetchJsonGSA } from '../fetch';
import { getValidAPIYear } from '../dates';
import { sortLocations } from './sortLocations';
import { keepUniqueLocations } from './keepUniqueLocations';

const createLocations = (data: RateLodging[]): Location[] => {
    return data
        .filter(rate => rate.State !== null && rate.State !== '')
        .map(rate => {
            return {
                country: rate.State,
                label: LIST_US_STATES.find(
                    state => state.country === rate.State,
                )?.label,
            };
        });
};

export const getCountriesDomestic = async (
    date: DateRaw,
): Promise<Location[]> => {
    try {
        return await fetchJsonGSA<RateLodging>(getValidAPIYear(date), 'lodging')
            .then(data => createLocations(data))
            .then(data => sortLocations(data, 'country'))
            .then(data => keepUniqueLocations(data, 'country'));
    } catch (error) {
        throw new Error(
            `Failed to get domestic countries for ${date} - ${error}`,
        );
    }
};

const LIST_US_STATES: Location[] = [
    {
        country: 'AL',
        label: 'Alabama (AL)',
    },
    {
        country: 'AZ',
        label: 'Arizona (AZ)',
    },
    {
        country: 'AR',
        label: 'Arkansas (AR)',
    },
    {
        country: 'CA',
        label: 'California (CA)',
    },
    {
        country: 'CO',
        label: 'Colorado (CO)',
    },
    {
        country: 'CT',
        label: 'Connecticut (CT)',
    },
    {
        country: 'DE',
        label: 'Delaware (DE)',
    },
    {
        country: 'DC',
        label: 'District Of Columbia (DC)',
    },
    {
        country: 'FL',
        label: 'Florida (FL)',
    },
    {
        country: 'GA',
        label: 'Georgia (GA)',
    },
    {
        country: 'ID',
        label: 'Idaho (ID)',
    },
    {
        country: 'IL',
        label: 'Illinois (IL)',
    },
    {
        country: 'IN',
        label: 'Indiana (IN)',
    },
    {
        country: 'IA',
        label: 'Iowa (IA)',
    },
    {
        country: 'KS',
        label: 'Kansas (KS)',
    },
    {
        country: 'KY',
        label: 'Kentucky (KY)',
    },
    {
        country: 'LA',
        label: 'Louisiana (LA)',
    },
    {
        country: 'ME',
        label: 'Maine (ME)',
    },
    {
        country: 'MD',
        label: 'Maryland (MD)',
    },
    {
        country: 'MA',
        label: 'Massachusetts (MA)',
    },
    {
        country: 'MI',
        label: 'Michigan (MI)',
    },
    {
        country: 'MN',
        label: 'Minnesota (MN)',
    },
    {
        country: 'MS',
        label: 'Mississippi (MS)',
    },
    {
        country: 'MO',
        label: 'Missouri (MO)',
    },
    {
        country: 'MT',
        label: 'Montana (MT)',
    },
    {
        country: 'NE',
        label: 'Nebraska (NE)',
    },
    {
        country: 'NV',
        label: 'Nevada (NV)',
    },
    {
        country: 'NH',
        label: 'New Hampshire (NH)',
    },
    {
        country: 'NJ',
        label: 'New Jersey (NJ)',
    },
    {
        country: 'NM',
        label: 'New Mexico (NM)',
    },
    {
        country: 'NY',
        label: 'New York (NY)',
    },
    {
        country: 'NC',
        label: 'North Carolina (NC)',
    },
    {
        country: 'ND',
        label: 'North Dakota (ND)',
    },
    {
        country: 'OH',
        label: 'Ohio (OH)',
    },
    {
        country: 'OK',
        label: 'Oklahoma (OK)',
    },
    {
        country: 'OR',
        label: 'Oregon (OR)',
    },
    {
        country: 'PA',
        label: 'Pennsylvania (PA)',
    },
    {
        country: 'RI',
        label: 'Rhode Island (RI)',
    },
    {
        country: 'SC',
        label: 'South Carolina (SC)',
    },
    {
        country: 'SD',
        label: 'South Dakota (SD)',
    },
    {
        country: 'TN',
        label: 'Tennessee (TN)',
    },
    {
        country: 'TX',
        label: 'Texas (TX)',
    },
    {
        country: 'UT',
        label: 'Utah (UT)',
    },
    {
        country: 'VT',
        label: 'Vermont (VT)',
    },
    {
        country: 'VA',
        label: 'Virginia (VA)',
    },
    {
        country: 'WA',
        label: 'Washington (WA)',
    },
    {
        country: 'WV',
        label: 'West Virginia (WV)',
    },
    {
        country: 'WI',
        label: 'Wisconsin (WI)',
    },
    {
        country: 'WY',
        label: 'Wyoming (WY)',
    },
] as const;
