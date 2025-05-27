export const DEBOUNCE_TIME = 150;
export const BTN_ANIMATE_MS = 450;
export const ROW_ANIMATE_MS = 350;
export const US_STATE_LENGTH = 'NY'.length;
export const OCTOBER = 10;

const SECONDS_IN_MS = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
export const MILLISECONDS_IN_DAY =
    SECONDS_IN_MS * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * HOURS_IN_DAY;

const AVERAGE_DAYS_IN_YEAR = 365.25;
const MONTHS_IN_YEAR = 12;
const MONTHS_IN_DURATION = 6;

// Calculate the average days in a month
const AVERAGE_DAYS_IN_MONTH = AVERAGE_DAYS_IN_YEAR / MONTHS_IN_YEAR;

// The constant for approximate days in 6 months
export const APPROX_DAYS_IN_6_MONTHS =
    AVERAGE_DAYS_IN_MONTH * MONTHS_IN_DURATION;

export const SCREEN_WIDTH_SM = 640;
export const SCREEN_WIDTH_LG = 1024;
export const ROW_CLOSED_HEIGHT = 96;
