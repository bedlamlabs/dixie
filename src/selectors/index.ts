/**
 * CSS Selectors — barrel export.
 */

export { parseSelector, clearSelectorCache } from './SelectorParser';
export type {
  SelectorList,
  ComplexSelector,
  CompoundSelector,
  SimpleSelector,
  AttributeOperator,
  Combinator,
} from './SelectorParser';

export {
  matchesSelector,
  querySelectorAllElements,
  querySelectorFirstElement,
  _fastQueryFirst,
  _fastQueryAll,
} from './SelectorMatcher';
