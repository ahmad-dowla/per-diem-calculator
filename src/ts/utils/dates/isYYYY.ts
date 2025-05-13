import type { YYYY } from '../../types/dates';

import { years } from './years';
import { inPrimitiveType } from '../misc';

export const isYYYY = (s: string): s is YYYY => {
  return inPrimitiveType(years, s);
};
