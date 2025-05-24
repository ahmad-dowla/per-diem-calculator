# Per Diem Calculator

Open source per diem calculator for both domestic and international trips. Built in TypeScript with Tailwind. Rates sourced directly from General Services Administration (GSA), Dept. of State, and Dept. of Defense (DOD).

## Features

- Lookup both domestic and international rates in one place and get accurate deductions for first/last day and meals provided
- print expense report PDF that includes daily breakdown, rates used, and links to the original federal source
- Full keyboard-only navigation support
- TK accessibility compliance
- Developers: calculator outputs expenses as object that can be easily incorporated into other tools

## Issues resolved

- No existing calculator for end users that lets them lookup both domestic and international rates, and also lets them deduct meals provided
- No existing calculator for developers to integrate into their expense management system
- No API for OCONUS rates from Dept. of State and Dept. of Defense

## Who this is for

- Individuals who want to quickly and easily look up their lodging and meals per diem allowances - https://perdiemcalc.org
- Developers who want to integrate into their expense platform - see console in https://perdiemcalc.org/object to outputted expense object that can be incorporated into projects

## Usage

- https://perdiemcalc.org
- Develop locally

## Local Development

- deploy per diem proxy - https://github.com/ahmad-dowla/per-diem-calculator-proxy
- VITE_PROXY_KEY, VITE_PROXY_URL, GSA_API_KEY
-

## Config

- Expense object printed to console - https://perdiemcalc.org/object/
- Unstyled - https://perdiemcalc.org/unstyled/

## Behind scenes

GSA API
DOD zip files unpacked with JSZIP, parsed with DOMParser and XPathEvaluator
API calls reduced with memoization and caching results in Cloudflare on the proxy side

## Built with

TypeScript - native web components encapsulated in shadow DOM
Tailwind
TomSelect for searchable dropdowns
JSZip to unpack
DOMPurify to santize developer config object

## Planned Updates

- Dark mode
- Add CSS paths to make it easy to style shadowDOM elements
- CDN option
- Option to display rates only vs calculating expenses
- React version
