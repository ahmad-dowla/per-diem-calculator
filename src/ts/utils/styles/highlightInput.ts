import { BTN_ANIMATE_MS } from '../config';

export const highlightSuccess = (input: HTMLElement | SVGElement) => {
    input.classList.toggle('success');
    setTimeout(() => {
        input.classList.toggle('success');
    }, BTN_ANIMATE_MS);
};

export const highlightError = (input: HTMLElement | SVGElement) => {
    input.classList.toggle('error');
    setTimeout(() => {
        input.classList.toggle('error');
    }, BTN_ANIMATE_MS);
};
