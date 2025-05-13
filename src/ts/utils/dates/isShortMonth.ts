import { shortMonths } from './shortMonths';

import { inPrimitiveType } from '../misc';
import { ShortMonth } from '../../types/dates';

export const isShortMonth = (s: string): s is ShortMonth => {
  return inPrimitiveType(shortMonths, s);
};
