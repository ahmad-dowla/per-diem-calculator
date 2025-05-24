// Types
import type { Location } from '../../types/locations';

export const keepUniqueLocations = (
    data: Location[],
    key: 'country' | 'city',
): Location[] => {
    return data.filter((record, i, arr) => {
        if (i === 0) return true;
        return record[key] !== arr[i - 1][key];
    });
};
