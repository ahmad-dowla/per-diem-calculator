type TimeoutId = ReturnType<typeof setTimeout> | null;
type DebouncedFunction = (...args: any[]) => void;

export const debounce = (
    callback: DebouncedFunction,
    delay: number,
): DebouncedFunction => {
    let timeoutId: TimeoutId = null;
    return (...args: any[]): void => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            callback(...args);
            timeoutId = null; // Reset the timeout
        }, delay);
    };
};
