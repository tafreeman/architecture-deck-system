/**
 * Shared navigation types.
 *
 * `DeckMeta` is the minimal deck-summary shape consumed by deck-switching UI
 * (ControlPanel, DeckPicker). It was previously duplicated in both components;
 * it now lives here as the single source of truth.
 */

/** Minimal deck summary used by deck-switching UI controls. */
export interface DeckMeta {
  title: string;
  titleAccent?: string;
}
