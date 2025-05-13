import type {
    StateLocationItem,
    StateLocationItemValid,
} from '../../types/locations';

export const returnValidStateLocation = (
    location: StateLocationItem,
): StateLocationItemValid | null => {
    const { startDate, endDate, country, city } = location;
    if (!(startDate && endDate && country && city)) return null;
    return { startDate, endDate, country, city };
};
