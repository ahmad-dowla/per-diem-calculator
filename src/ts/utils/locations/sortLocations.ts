// Types
import type { Location } from '../../types/locations';

export const sortLocations = (
    data: Location[],
    key: 'country' | 'city',
    domesticCities: 'domesticCities' | null = null,
): Location[] => {
    if (!domesticCities)
        return data.sort((a, b) => (a[key] || '').localeCompare(b[key] || ''));

    return data
        .filter(rate => rate[key] === 'Standard Rate')
        .concat(
            data
                .filter(rate => rate[key] !== 'Standard Rate')
                .sort((a, b) => (a[key] || '').localeCompare(b[key] || '')),
        );
};
