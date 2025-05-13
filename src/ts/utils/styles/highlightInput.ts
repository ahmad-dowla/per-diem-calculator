export const highlightSuccess = (input: HTMLElement | SVGElement) => {
    input.classList.toggle('success');
    setTimeout(() => {
        input.classList.toggle('success');
    }, 400);
};

export const highlightError = (input: HTMLElement | SVGElement) => {
    input.classList.toggle('error');
    setTimeout(() => {
        input.classList.toggle('error');
    }, 400);
};
