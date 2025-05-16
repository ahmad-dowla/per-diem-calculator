// Types
import { Config } from '../../types/config';

// Utils
import { configDefault } from './config';
import DOMPurify from 'dompurify';

export const sanitizeConfig = (configUser: Partial<Config> | null): Config => {
    const sanitizedConfig = { ...configDefault }; // Start with defaults
    if (!configUser) return sanitizedConfig;

    // Sanitize 'styled'
    if (configUser.styled !== undefined) {
        sanitizedConfig.styled = !!configUser.styled; // Ensure it's a boolean
    }

    // Sanitize 'location'
    if (configUser.location) {
        const { heading, body } = configUser.location;
        if (heading)
            sanitizedConfig.location.heading = DOMPurify.sanitize(heading);
        if (body) sanitizedConfig.location.body = DOMPurify.sanitize(body);
    }

    // Sanitize 'expense'
    if (configUser.expense) {
        const { heading, headingPrint, body, bodyPrint } = configUser.expense;
        if (heading)
            sanitizedConfig.expense.heading = DOMPurify.sanitize(heading);
        if (headingPrint)
            sanitizedConfig.expense.headingPrint =
                DOMPurify.sanitize(headingPrint);
        if (body) sanitizedConfig.expense.body = DOMPurify.sanitize(body);
        if (bodyPrint)
            sanitizedConfig.expense.bodyPrint = DOMPurify.sanitize(bodyPrint);
    }

    return sanitizedConfig;
};
