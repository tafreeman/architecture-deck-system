/**
 * Zod schemas for runtime validation of deck content.
 *
 * Wired into the app via content-registry.ts:
 *   - validateContentPack(id, raw)            — soft-validates each content.json (warns, never throws)
 *   - validateLayoutsExist(manifest, registry) — asserts every slide layout is registered
 *
 * Usage:
 *   import { validateContentPack } from '../patterns/decks/schema';
 *   validateContentPack("my-deck", rawJson);
 */

import { z } from 'zod';

/* ── Slide schema ──────────────────────────────────────────── */

const CardSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  stat: z.union([z.string(), z.number()]).optional(),
  statLabel: z.string().optional(),
  icon: z.string().optional(),
  before: z.string().optional(),
  after: z.string().optional(),
}).passthrough();

const StepSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
});

const LaneSchema = z.object({
  persona: z.string(),
  steps: z.array(StepSchema),
  color: z.string().optional(),
});

const SlideSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  layout: z.string().min(1),

  label: z.string().optional(),
  description: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  callout: z.string().optional(),
  eyebrow: z.string().optional(),
  quote: z.string().optional(),
  quoteAuthor: z.string().optional(),

  cards: z.array(CardSchema).optional(),
  talkingPoints: z.array(z.string()).optional(),
  results: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
  steps: z.array(StepSchema).optional(),
  details: z.record(z.string(), z.any()).optional(),

  items: z.array(z.record(z.string(), z.any())).optional(),
  badges: z.array(z.object({
    icon: z.string().optional(),
    label: z.string(),
    value: z.union([z.string(), z.number()]),
  })).optional(),
  rows: z.array(z.record(z.string(), z.any())).optional(),

  lanes: z.array(LaneSchema).optional(),

  color: z.string().optional(),
  colorLight: z.string().optional(),
  colorGlow: z.string().optional(),
  bgOverride: z.string().optional(),

  heroImg: z.string().optional(),
}).passthrough(); // Allow deck-specific extra fields

/* ── Validation functions ──────────────────────────────────── */

/**
 * Validate that all slides reference registered layouts.
 * Call after validateDeckManifest to catch layout typos.
 */
export function validateLayoutsExist(
  manifest: { slides: readonly { id: string; layout: string }[] },
  registry: { has: (id: string) => boolean; list: () => string[] },
): void {
  const missing = manifest.slides.filter((s) => !registry.has(s.layout));

  if (missing.length > 0) {
    const layouts = missing.map((s) => `"${s.layout}" (slide ${s.id})`).join(', ');
    const available = registry.list().join(', ');
    throw new Error(
      `Unknown layouts in deck manifest: ${layouts}. Available: ${available}`,
    );
  }
}

/* ── ContentPack schema (validates content.json files) ────────── */
//
// content.json files have a different shape from DeckManifest:
//   { deck: { brandLine, title, ... }, slides: Record<string, slide> }
// This schema validates that shape for runtime safety.

const IntroStatSchema = z.object({
  val: z.string(),
  lbl: z.string(),
});

const DeckMetaSchema = z.object({
  brandLine: z.string(),
  title: z.string(),
  titleAccent: z.string().optional(),
  tagline: z.string().optional(),
  introBrandLine: z.string().optional(),
  introTitle: z.string().optional(),
  introSubtitle: z.string().optional(),
  introStats: z.array(IntroStatSchema).optional(),
  stats: z.array(IntroStatSchema).optional(),
}).passthrough();

export const ContentPackDataSchema = z.object({
  deck: DeckMetaSchema,
  slides: z.record(z.string(), SlideSchema),
});

/**
 * Validate a raw content.json import against the ContentPackDataSchema.
 * Logs a warning on failure rather than throwing — invalid content is
 * displayed with degraded fidelity rather than crashing the presenter.
 */
export function validateContentPack(id: string, data: unknown): void {
  const result = ContentPackDataSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten();
    console.warn(`[ContentPack "${id}"] Validation warnings:`, errors);
  }
}
