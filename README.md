# Introduction

This is an open source per diem calculator to pull lodging and meals per diem rates, and factor deductions, for both domestic and international trips. A demo can be found here: https://perdiemcalc.org.

There are a few issues with the tools available as of May 2025:

- No existing calculators for end users that pull both domestic and international rates and deductions
- The General Services Administration (GSA) has an API that provides rates for CONUS (48 states) rates--however, no API is available for OCONUS rates by Department of Defense (DOD) for Alaska, Hawaii, and US territories, or by the State Dept. for all other locations.
- No existing calculators for developers to easily pull domestic and international rates/deductions into their application
- Many existing calculators limited to a single location and can't be used in one go for multi-destination trips

This calculator was built to address all the above issues. It's a single tool that:

- Pulls both domestic and international rates
- Accounts for multi-destination trips
- Gets rates directly from federal sources via GSA's API; and via downloading OCONUS rate zip files from the Dept. of Defense (which includes the State Department's OCONUS rates), unpacking them using JSZIP, and parsing the rate XML file using DOMParser and XPathEvaluator
- Easily incorporates into existing projects by being built with native Javascript web components

## Usage

Add to your project:

```
npm install @per-diem-calculator/vanilla
```

Setup the accompanying [CORS/API proxy](https://github.com/ahmad-dowla/per-diem-calculator-proxy) and use the following environment variables:

```
VITE_PROXY_URL="URL_FROM_PROXY"
VITE_PROXY_KEY="KEY_FROM_PROXY"
```

Add to your frontend markup:

```
<!-- index.html -->
<div id="perDiemCalc"></div>
<script type="module" src="script.js"></script>
```

```
/// script.js
import { Pdc } from '@per-diem-calculator/vanilla';

const container = document.querySelector('#perDiemCalc');

new Pdc(container);
```

The expenses can be outputted to an object for further use in your application (see your console in [this demo](https://perdiemcalc.org/object) and this [example object](#expense-object)):

```
import { Pdc } from '@per-diem-calculator/vanilla';

const container = document.querySelector('#perDiemCalc');

const pdc = new Pdc(container);

pdc.addEventListener('expenseUpdate', e => {
    const { data } = e.detail;
    console.table(data);
});

```

## Additional features

- Save an expense report PDF that includes daily breakdown, rates used, and links to the original federal source
- Full keyboard-only navigation support
- API calls are reduced via both memoization by the calculator, and caching results in Cloudflare by the proxy

## Expense object

```
{
  date: "2025-05-27",
  country: "AR" // for domestic rates, states are counted as countries
  city: "Hot Springs"
  deductions: {
    FirstLastDay: true,
    breakfastProvided: true,
    lunchProvided: true,
    dinnerProvided: false,
  },
  rates: {
    effDate: "2025-05-01",
    deductionBreakfast: 16,
    deductionLunch: 19,
    ​deductionDinner: 28,
    maxIncidental: 5,
    maxLodging: 114,
    maxMie: 68,
    maxMieFirstLast: 51,
  },
  lodgingAmount: 114,
  mieAmount: 16,
  totalAmount: 130,
  source: "https://www.gsa.gov/travel/plan-book/per-diem-rates/per-diem-rates-results?action=perdiems_report&fiscal_year=2025&state=AR&city=Hot Springs"
}
```

## Built with

- TypeScript
- Tailwind
- [Tom Select](https://github.com/orchidjs/tom-select) ([Apache-2.0](https://github.com/orchidjs/tom-select?tab=Apache-2.0-1-ov-file)) for searchable dropdowns
- [JSZip](https://github.com/Stuk/jszip) ([MIT](https://github.com/Stuk/jszip?tab=License-1-ov-file)) to unpack DOD rate zip files
- [DOMPurify](https://github.com/cure53/DOMPurify) ([Apache-2.0](https://github.com/cure53/DOMPurify?tab=License-1-ov-file)) to santize config options

## Planned Updates

- Accessibility improvements to reach full WCAG compliance
- CSS paths for an easy way to style shadowDOM elements
- Option to display rates onscreen vs just in the generated PDF
- Option to mark personal days and remove them from the final expense amount
- React version - I used this project as a way to get familiar with native web components, but a React version will be shared soon
- CDN option
