/**
 * transcription/types.ts — Shared types, helpers, and layout set constants
 * for cross-family layout normalisation.
 *
 * Extracted from transcription.ts (DECK-4). Pure extraction — no logic
 * changes. Each transcribeTo* family module imports from here.
 */

export type Topic = Record<string, unknown> & { layout: string };

/** Loose shape for the heterogeneous card/step/item objects topics carry. */
export interface SlideItem {
  title?: string; body?: string; stat?: string; statLabel?: string; step?: string;
  eyebrow?: string; icon?: string; label?: string; name?: string; desc?: string;
  value?: string | number; meta?: string; num?: string; type?: string; tip?: string;
  val?: string; sub?: string; text?: string; attr?: string; challenge?: string;
  fix?: string; persona?: string; subtitle?: string; banner?: string;
  items?: unknown[]; bars?: SlideItem[]; cards?: SlideItem[]; steps?: SlideItem[];
  [key: string]: unknown;
}

/** Coerce an unknown field to a typed array (non-arrays -> []). */
export const arr = <T = SlideItem>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/**
 * Render a possibly-object `SlideItem | string` item as display text.
 * `items` arrays are frequently heterogeneous (raw strings or SlideItem
 * objects) — stringifying an object directly renders "[object Object]".
 */
export const itemText = (i: SlideItem | string): string =>
  typeof i === "string" ? i : i.label || i.title || "";

// ── Layout set constants ───────────────────────────────────────────────────

export const BASE_LAYOUTS = new Set(["two-col","stat-cards","before-after","process-cycle","h-strip","process-lanes"]);
export const VERGE_LAYOUTS = new Set(["stat-hero","quote-collage","badge-grid","data-table","bar-chart","color-blocks"]);
export const HANDBOOK_LAYOUTS = new Set(["hb-chapter","hb-practices","hb-process","hb-manifesto","hb-index"]);
export const ADV_LAYOUTS = new Set(["adv-overview","adv-stats","adv-hurdles","adv-future","adv-platform"]);
export const ADVD_LAYOUTS = new Set(["advd-overview","advd-stats","advd-hurdles","advd-future","advd-platform"]);
