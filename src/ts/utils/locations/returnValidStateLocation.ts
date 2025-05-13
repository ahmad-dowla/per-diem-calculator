import type {
    StateLocationItem,
    StateLocationItemValid,
} from '../../types/locations';

export const returnValidStateLocation = (
    location: StateLocationItem,
): StateLocationItemValid | null => {
    const { start, end, country, city } = location;
    if (!(start && end && country && city)) return null;
    return { start, end, country, city };
};
