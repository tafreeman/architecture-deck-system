/**
 * Shared navigation / deck types.
 *
 * `DeckMeta` is the minimal deck-summary shape consumed by deck-switching UI
 * (ControlPanel, DeckPicker). It was previously duplicated in both components;
 * it now lives here as the single source of truth.
 *
 * `DeckSlide`, `SprintNode`, and `DeckData` replace the former
 * `type DeckContent = Record<string, any>` escape hatch with structural,
 * index-signature-backed types. They stay schema-light (the index signature
 * preserves deck-specific extra fields) while documenting the fields the app
 * and its UI actually read.
 */

import type { BaseTopicProps } from "../../layouts/registry.ts";

/** Minimal deck summary used by deck-switching UI controls. */
export interface DeckMeta {
  title: string;
  titleAccent?: string;
}

/** A single intro/footer stat entry (e.g. `{ val: "39", lbl: "Layouts" }`). */
export interface DeckStat {
  val: string;
  lbl: string;
  color?: string;
  [key: string]: unknown;
}

/**
 * A fully-resolved slide ("topic") as every layout component receives it —
 * the registry's {@link BaseTopicProps} (requires `id`, `title`, `color`).
 * This is the shape of the rendered `deckTopics` array after normalisation and
 * theme-colour resolution.
 */
export type DeckSlide = BaseTopicProps;

/**
 * A raw slide as it arrives from a deck's content/structure layer (schema-light
 * — `title`/`color` are only guaranteed after `normalizeDeckTopics`). Deck
 * presets hold these; `normalizeDeckTopics` widens them to {@link DeckSlide}.
 */
export interface RawDeckSlide {
  readonly id: string;
  readonly layout?: string;
  readonly title?: string;
  readonly color?: string;
  readonly colorLight?: string;
  readonly colorGlow?: string;
  readonly icon?: string;
  readonly num?: string;
  readonly [key: string]: unknown;
}

/** A node in the sprint-cycle layout (e.g. `{ abbr: "RQ", icon: "📋" }`). */
export interface SprintNode {
  readonly abbr: string;
  readonly label?: string;
  readonly type?: string;
  readonly icon?: string;
  readonly [key: string]: unknown;
}

/**
 * A built deck preset. Carries the {@link DeckMeta} summary fields plus the
 * runtime arrays the presenter renders (`topics`, `sprintNodes`) and the
 * deck-level splash fields. The index signature keeps it schema-light for the
 * rest of its dynamic content; `topics` holds {@link RawDeckSlide}s that the
 * app normalises into {@link DeckSlide}s before rendering.
 */
export interface DeckData extends DeckMeta {
  readonly id?: string;
  readonly themeId?: string;
  readonly brandLine?: string;
  readonly tagline?: string;
  readonly introBrandLine?: string;
  readonly introTitle?: string;
  readonly introSubtitle?: string;
  readonly introStats?: readonly DeckStat[];
  readonly stats?: readonly DeckStat[];
  readonly topics?: readonly RawDeckSlide[];
  readonly sprintNodes?: readonly SprintNode[];
  readonly [key: string]: unknown;
}
