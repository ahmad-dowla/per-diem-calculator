export const handlePointerDown = (event: PointerEvent) => {
    return { pointerStartX: event.clientX, pointerStartY: event.clientY };
};
