// Types
import type { YYYY } from '../../types/dates';

// Utils
import JSZip from 'jszip';
import { memoize } from './memoize';
import { getYY } from '../dates';

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
    await zip.loadAsync(resFile);
    const filename = `ocallhist-${getYY(year, 'YYYY')}.xml`;
    const data = await zip.file(filename)?.async('string');
    if (!data)
        throw new Error(`Failed to extract XML file from zip from ${url}`);
    return data;
};

const fetchXmlDODmemo = memoize(fetchXmlDOD);

export { fetchXmlDODmemo as fetchXmlDOD };
