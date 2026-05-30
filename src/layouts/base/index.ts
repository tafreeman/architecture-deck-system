/**
 * Barrel — base layout family.
 *
 * Re-exports every layout in the `base/` directory so consumers can do:
 *   import { TwoColLayout, StatCardsLayout } from '../layouts/base';
 */

export { default as TwoColLayout } from "./TwoColLayout.tsx";
export {
  default as StatCardsLayout,
  ManifestStatCardsLayout,
} from "./StatCardsLayout.tsx";
export { default as BeforeAfterLayout } from "./BeforeAfterLayout.tsx";
export { default as HStripLayout } from "./HStripLayout.tsx";
export { default as ProcessLanesLayout } from "./ProcessLanesLayout.tsx";
