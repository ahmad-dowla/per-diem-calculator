// Types
import type { YYYY } from '../../types/dates';

// Utils
import JSZip from 'jszip';
import { memoize } from './memoize';
import { DOD_XML_URL } from './DOD_XML_URL';

// Download relational zip file from US DOD (https://www.travel.dod.mil/Travel-Transportation-Rates/Per-Diem/Per-Diem-Rate-Lookup/) -> unzip the XML file with JSZip
const fetchXmlDOD = async (year: YYYY) => {
    const url = `${import.meta.env.VITE_PROXY_URL}?url=${DOD_XML_URL.replace('API_YEAR_FROM_MODEL', year)}`;
    const res = await fetch(url, {
        headers: {
            'x-perdiem-key': import.meta.env.VITE_PROXY_KEY,
        },
    });
    if (!res.ok) throw new Error(`Failed to download file from ${url}`);
    const resFile = await res.arrayBuffer();
    if (!resFile)
        throw new Error(`Failed to write file from ${url} to arrayBuffer`);
    const zip = new JSZip();
    await zip.loadAsync(resFile);
    const filename = `ocallhist-${year.slice(2, 4)}.xml`;
    const data = await zip.file(filename)?.async('string');
    if (!data)
        throw new Error(`Failed to extract XML file from zip from ${url}`);
    return data;
};

const fetchXmlDODmemo = memoize(fetchXmlDOD);

export { fetchXmlDODmemo as fetchXmlDOD };
