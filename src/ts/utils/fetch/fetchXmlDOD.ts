// Types
import type { YYYY } from '../../types/dates';

// Utils
import JSZip from 'jszip';
import { memoize } from './memoize';
import { getYY, isYYYY } from '../dates';

const PROXY_URL = import.meta.env.VITE_PROXY_URL;
const PROXY_KEY = import.meta.env.VITE_PROXY_KEY;
const DOD_XML_URL = `https://www.travel.dod.mil/Portals/119/Documents/Allowances/Per_Diem/OCONUS/REL/OCONUS-REL-API_YEAR_FROM_MODEL.zip`;

const ZIP_SIGNATURE_BYTE_1 = 0x50; // 'P'
const ZIP_SIGNATURE_BYTE_2 = 0x4b; // 'K'

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

    // Check "Magic Numbers" for ZIP (PK..)
    const bytes = new Uint8Array(resFile);
    const isZip =
        bytes[0] === ZIP_SIGNATURE_BYTE_1 && bytes[1] === ZIP_SIGNATURE_BYTE_2;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!isZip) {
        if (currentYear === +year && currentMonth === 1) {
            // Gracefully handle transition period between years where DoD may put out a temporary locked ZIP file for first few weeks of January. That locked file will trigger an error in JZIP so we'll switch to using prior year rates.
            const fixedYear = (currentYear - 1).toString();
            console.warn(
                `${currentYear} data not yet public in finalized form. Falling back to ${fixedYear} data.`,
            );
            if (isYYYY(fixedYear)) return await fetchXmlDOD(fixedYear);
        }
        throw new Error(
            `Downloaded file for ${year} is not a valid ZIP archive.`,
        );
    }

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
