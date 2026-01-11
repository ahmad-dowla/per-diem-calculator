// Types
import type { YYYY } from '../../types/dates';

// Utils
import JSZip from 'jszip';
import { memoize } from './memoize';
import { getYY, isYYYY } from '../dates';

const PROXY_URL = import.meta.env.VITE_PROXY_URL;
const PROXY_KEY = import.meta.env.VITE_PROXY_KEY;
const DOD_XML_URL = `https://www.travel.dod.mil/Portals/119/Documents/Allowances/Per_Diem/OCONUS/REL/OCONUS-REL-API_YEAR_FROM_MODEL.zip`;

// Download relational zip file from US DOD (https://www.travel.dod.mil/Travel-Transportation-Rates/Per-Diem/Per-Diem-Rate-Lookup/) -> unzip the XML file with JSZip
const fetchXmlDOD = async (year: YYYY) => {
    const url = `${PROXY_URL}?url=${DOD_XML_URL.replace('API_YEAR_FROM_MODEL', year)}`;
    const res = await fetch(url, {
        headers: {
            'x-perdiem-key': PROXY_KEY,
        },
    });
    if (!res.ok) throw new Error(`Failed to download file from ${url}`);

    const resFile = await res.arrayBuffer();
    if (!resFile)
        throw new Error(`Failed to write file from ${url} to arrayBuffer`);

    const zip = new JSZip();

    try {
        await zip.loadAsync(resFile);
        const filename = `ocallhist-${getYY(year, 'YYYY')}.xml`;
        const data = await zip.file(filename)?.async('string');
        if (!data)
            throw new Error(`Failed to extract XML file from zip from ${url}`);
        return data;
    } catch (e) {
        // Gracefully handle transition period between years where DoD may put out a temporary locked ZIP file for first few weeks of January. That locked file will trigger an error in JZIP so we'll switch to using prior year rates.
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (+year === currentYear && currentMonth === 1) {
            const fixedYear = (currentYear - 1).toString();
            console.warn(
                `${currentYear} data not yet public in finalized form. Falling back to ${fixedYear} data.`,
            );
            if (isYYYY(fixedYear)) return await fetchXmlDOD(fixedYear);
        }
        // If it's not a current-year transition issue, throw the original error
        throw new Error(`Failed to process DOD ZIP for ${year}: ${e}`);
    }
};

const fetchXmlDODmemo = memoize(fetchXmlDOD);

export { fetchXmlDODmemo as fetchXmlDOD };
