import type { YYYY } from '../../types/dates';

import { memoize } from './memoize';
import { GSA_API_URL } from './GSA_API_URL';

const fetchJsonGSA = async <T>(
    year: YYYY,
    type: 'lodging' | 'mie',
): Promise<T[]> => {
    const url = `${import.meta.env.VITE_PROXY_URL}?url=${GSA_API_URL.replace('API_YEAR_FROM_MODEL', year).replace('API_TYPE_FROM_MODEL', type)}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'x-perdiem-key': import.meta.env.VITE_PROXY_KEY,
        },
    });
    if (!res.ok) throw new Error(`Failed to get API results from ${url}.`);
    const result = await res.json();
    return result;
};

const fetchJsonGSAMemo = memoize(fetchJsonGSA);

export { fetchJsonGSAMemo as fetchJsonGSA };
