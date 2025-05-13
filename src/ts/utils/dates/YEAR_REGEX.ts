export const YEAR_MIN_REGEX = /^((?:1\d{3})|(?:20(?:0\d|1\d|20)))/;
export const YEAR_MAX_REGEX =
    /^(?:[3-9]\d{3,}|[2-9]\d{4,}|20(?:4[1-9]|5\d|6\d|7\d|8\d|9\d))/;
export const YEAR_INCOMPLETE_REGEX = /^0\d{3}/; // 0000 to 0999
