export const removeStyles = (HTML: string) => {
    // Remove all instances of `class="..."`
    // Remove all instances of `styled="true"`
    // Remove all SVG elements
    return HTML.replaceAll(/class="[^"]*"/gi, '')
        .replaceAll('styled="true"', '')
        .replaceAll(
            /<svg[^>]*data-pdc-unstyled="([^"]*)"[^>]*>[\s\S]*?<\/svg>/gi,
            (_, attributeValue) => {
                return attributeValue;
            },
        )
        .replaceAll(/<svg[\s\S]*?<\/svg>/gi, '');
};
