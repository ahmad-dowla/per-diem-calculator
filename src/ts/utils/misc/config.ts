import type { Config } from '../../types/config';

export const configDefault: Config = {
    styled: true,
    location: {
        heading: 'Trip Details',
    },
    expense: {
        heading: 'Expenses',
        body: 'Confirm meals provided/lodging amount for each day.',
    },
};
