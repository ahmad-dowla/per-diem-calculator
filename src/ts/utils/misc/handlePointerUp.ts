const tolerance = 5;

export const handlePointerUp = (
    event: PointerEvent,
    clickFunction: Function,
    pointerStartX: number,
    pointerStartY: number,
) => {
    const pointerEndX = event.clientX;
    const pointerEndY = event.clientY;

    const deltaX = Math.abs(pointerEndX - pointerStartX);
    const deltaY = Math.abs(pointerEndY - pointerStartY);

    if (deltaX <= tolerance && deltaY <= tolerance && event.button === 0) {
        // This was a tap or a click, not a drag (no significant movement)
        clickFunction(event);
    }

    // Reset pointer coordinates
    return { pointerStartX: 0, pointerStartY: 0 };
};
