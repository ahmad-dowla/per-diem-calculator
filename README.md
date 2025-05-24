# Per Diem Calculator

Open source per diem calculator for both domestic and international trips. Built in TypeScript with Tailwind. Rates sourced directly from General Services Administration (GSA), Dept. of State, and Dept. of Defense (DOD).

## Issues resolved

- No existing combined calculator
- No API for OCONUS rates from Dept. of State and Dept. of Defense
- Full keyboard-only navigation support

## Who this is for

- Individuals who want to quickly and easily look up their lodging and meals per diem allowances - https://perdiemcalc.org
- Developers who want to integrate into their expense platform - see console in https://perdiemcalc.org/object to outputted expense object that can be incorporated into projects

## Usage

- https://perdiemcalc.org
- Develop locally - deploy per diem proxy - https://github.com/ahmad-dowla/per-diem-calculator-proxy

## Behind scenes

GSA API
DOD zip files unpacked with JSZIP, parsed with DOMParser and XPathEvaluator
API calls reduced with memoization and caching results in Cloudflare on the proxy side

## Built with

TypeScript
Tailwind
TomSelect for searchable dropdowns
JSZip to unpack
DOMPurify to santize developer config object

## TK

This version is built independent of frameworks using native web components
React version released soon
