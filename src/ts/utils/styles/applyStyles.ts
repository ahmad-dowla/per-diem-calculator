// Workaround to fully apply Tailwind styles to Shadow DOM
// https://github.com/tailwindlabs/tailwindcss/issues/15005#issuecomment-2737489813

import styles from '../../../css/_styles.css?inline';

export const applyStyles = (shadowRoot: ShadowRoot) => {
    const shadowSheet = new CSSStyleSheet();
    shadowSheet.replaceSync(styles.replace(/:root/gu, ':host'));
    const properties = [];
    for (const rule of shadowSheet.cssRules) {
        if (rule instanceof CSSPropertyRule) {
            if (rule.initialValue) {
                properties.push(`${rule.name}: ${rule.initialValue}`);
            }
        }
    }
    shadowSheet.insertRule(`:host { ${properties.join('; ')} }`);
    shadowRoot.adoptedStyleSheets = [shadowSheet];
};
