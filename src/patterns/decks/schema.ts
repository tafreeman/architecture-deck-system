/**
 * Zod schemas for runtime validation of deck content.
 *
 * Wired into the app via content-registry.ts:
 *   - validateContentPack(id, raw)            — soft-validates each content.json (warns, never throws)
 *   - validateLayoutsExist(manifest, registry) — asserts every slide layout is registered
 *
 * Throwing sibling for CI/test gating (not wired into the runtime app path):
 *   - assertContentPackValid(id, raw) — same schema, throws instead of warning
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

// Matches content-types.ts's WorkflowStep — used by the top-level
// `steps` field (workflow/process-style slides, e.g. onboarding's
// "devworkflow" and studio's "our-process"). `label`/`description` are
// kept optional for looser callers; real content-pack data uses
// num/title/body/type/tip.
const StepSchema = z.object({
  num: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  tip: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
}).passthrough();

// Matches content-types.ts's Lane — `steps` is plain display strings here,
// distinct from the WorkflowStep-object `steps` used elsewhere on a slide.
const LaneSchema = z.object({
  persona: z.string(),
  steps: z.array(z.string()),
  color: z.string().optional(),
});

const SlideSchema = z.object({
  // NOTE: id/order/layout are optional here — content-pack slide objects
  // (validated via ContentPackDataSchema, below) never carry them. Per
  // content-types.ts's SlideContentMap contract, content.json is a
  // "text-only" layer; id/order/layout live in the companion structure.js
  // and are attached at merge time by mergeDeckContent(). Content-pack
  // slides instead carry `role`/`sourceLayout`, used for cross-deck
  // content-matching (see merge-deck-content.ts's match priority).
  id: z.string().min(1).optional(),
  order: z.number().int().positive().optional(),
  layout: z.string().min(1).optional(),
  role: z.string().optional(),
  sourceLayout: z.string().optional(),

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
  // Two shapes seen in real content packs: content-types.ts's ResultItem
  // (label/value, used by PillarsContent etc.) and a val/label pairing
  // (mirrors the deck-level IntroStatSchema, used by e.g. onboarding's
  // "disciplines" slide). Both fields optional + .passthrough() so either
  // shape validates without forcing one convention.
  results: z.array(z.object({
    label: z.string().optional(),
    value: z.union([z.string(), z.number()]).optional(),
    val: z.string().optional(),
  }).passthrough()).optional(),
  steps: z.array(StepSchema).optional(),
  details: z.record(z.string(), z.any()).optional(),

  items: z.array(z.record(z.string(), z.any())).optional(),
  // `label` and `value` are optional: verge-pop's "platforms" badges use
  // name/bgColor instead of label/value. .passthrough() keeps those extra
  // fields intact rather than forcing every pack into one badge shape.
  badges: z.array(z.object({
    icon: z.string().optional(),
    label: z.string().optional(),
    value: z.union([z.string(), z.number()]).optional(),
  }).passthrough()).optional(),
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

/**
 * Throwing sibling of validateContentPack, for CI/test gating.
 *
 * The runtime path (validateContentPack, above) deliberately only warns —
 * that's a presenter UX choice so a single bad content file degrades rather
 * than crashes. This function exists so tests/CI can still catch a malformed
 * content pack before it ships, by asserting over the same schema.
 */
export function assertContentPackValid(id: string, data: unknown): void {
  const result = ContentPackDataSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `[ContentPack "${id}"] invalid:\n${JSON.stringify(result.error.flatten(), null, 2)}`,
    );
  }
}
