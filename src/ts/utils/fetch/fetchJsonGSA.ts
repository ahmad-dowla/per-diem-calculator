// Types
import type { YYYY } from '../../types/dates';

// Utils
import { memoize } from './memoize';

const PROXY_URL = import.meta.env.VITE_PROXY_URL;
const PROXY_KEY = import.meta.env.VITE_PROXY_KEY;
const GSA_API_URL = 'https://api.gsa.gov/travel/perdiem/v2/rates/conus';

const fetchJsonGSA = async <T>(
    year: YYYY,
    type: 'lodging' | 'mie',
): Promise<T[]> => {
    const url = `${PROXY_URL}?url=${GSA_API_URL}/${type}/${year}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'x-perdiem-key': PROXY_KEY,
        },
    });
    if (!res.ok) throw new Error(`Failed to get API results from ${url}.`);
    const result = await res.json();
    return result;
};

const fetchJsonGSAMemo = memoize(fetchJsonGSA);

export { fetchJsonGSAMemo as fetchJsonGSA };
