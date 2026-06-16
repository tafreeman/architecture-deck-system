/**
 * Deck factory — builds the registered deck presets from each content module.
 *
 * Extracted from App.v14 so the app component stays a thin view. Each deck's
 * schema-light content/structure data is normalised here into the typed
 * {@link DeckData} shape the presenter renders. `DECKS`, `CURRENT_DECK`, and
 * `DECK_SUMMARIES` are the public surface consumed by App + useDeckState.
 */

// ── Content imports ────────────────────────────────────────────────────────
import * as current from "./content/current/deck.js";
import {
  themeId as genaiThemeId,
  contentSlides as genaiContentSlides,
  sprintNodes as genaiSprintNodes,
  deckMeta as genaiDeckMeta,
} from "./content/genai-advocacy/deck.js";
import * as vergePop from "./content/verge-pop/deck.js";
import * as onboarding from "./content/onboarding/deck.js";
import * as onboardingOp from "./content/onboarding-op/deck.js";
import * as studio from "./content/studio/deck.js";
import * as engineering from "./content/engineering/deck.js";

// ── Layout registry: side-effect import registers all 39 layouts ───────────
import "./layouts/register-all.ts";
import { layoutRegistry } from "./layouts/registry.ts";
import { SPRINT_NODE_ICONS } from "./layouts/sprint/register.ts";

import type {
  DeckMeta,
  DeckData,
  RawDeckSlide,
  SprintNode,
} from "./components/navigation/types.ts";

// ── Normalisers ─────────────────────────────────────────────────────────────

function padTopicNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function normalizeSprintNodes(
  nodes: readonly { readonly abbr: string; readonly icon?: string }[] | undefined,
): SprintNode[] {
  return (nodes || []).map((node) => ({
    ...node,
    icon: node.icon || SPRINT_NODE_ICONS[node.abbr] || "•",
  }));
}

function normalizeDeckTopics(slides: readonly RawDeckSlide[] | undefined): RawDeckSlide[] {
  return (slides || []).map((slide, index) => ({
    ...slide,
    num: slide.num || padTopicNumber(index),
    icon: slide.icon || layoutRegistry.getFeatures(slide.layout as string)?.icon || "•",
    colorLight: slide.colorLight || slide.color,
    colorGlow: slide.colorGlow || `${slide.color}33`,
    cards: slide.cards || [],
    heroPoints: slide.heroPoints || [],
    talkingPoints: slide.talkingPoints || [],
    focusPanels: (slide.focusPanels as unknown[]) || [],
    capabilities: (slide.capabilities as unknown[]) || [],
    lanes: (slide.lanes as unknown[]) || [],
  }));
}

/** A built deck preset — the typed {@link DeckData} shape. */
export type DeckPreset = DeckData;

/**
 * Raw config accepted by {@link createDeckPreset}. Decks supply schema-light
 * arrays from their content/structure layer (merge output, `.js` modules), so
 * the slide and node arrays are typed loosely here and normalised into the
 * stricter {@link DeckData} shape on the way out.
 */
type DeckPresetInput = DeckMeta & {
  topics?: readonly RawDeckSlide[];
  // Raw sprint nodes arrive from the merge/content layer with various closed
  // shapes (no index signature); normalizeSprintNodes widens them.
  sprintNodes?: readonly { readonly abbr: string; readonly icon?: string }[];
  [key: string]: unknown;
};

function createDeckPreset(config: DeckPresetInput): DeckPreset {
  return {
    ...config,
    topics: normalizeDeckTopics(config.topics),
    sprintNodes: normalizeSprintNodes(config.sprintNodes),
  } as DeckPreset;
}

// ── Built deck presets ──────────────────────────────────────────────────────

export const CURRENT_DECK = createDeckPreset({
  id: "current",
  themeId: current.themeId,
  ...current.deckMeta,
  topics: current.contentSlides,
  sprintNodes: current.sprintNodes,
});

const GENAI_MANIFEST_DECK = createDeckPreset({
  id: "genai",
  themeId: genaiThemeId,
  ...genaiDeckMeta,
  topics: genaiContentSlides,
  sprintNodes: genaiSprintNodes,
});

const VERGE_POP_DECK = createDeckPreset({
  id: "verge-pop",
  themeId: vergePop.themeId,
  ...vergePop.deckMeta,
  topics: vergePop.contentSlides,
  sprintNodes: vergePop.sprintNodes,
});

const STUDIO_DECK = createDeckPreset({
  id: "studio",
  themeId: studio.themeId,
  ...studio.deckMeta,
  topics: studio.contentSlides,
  sprintNodes: studio.sprintNodes,
});

const ONBOARDING_OP_DECK = createDeckPreset({
  id: "onboarding-op",
  themeId: onboardingOp.themeId,
  ...onboardingOp.deckMeta,
  topics: onboardingOp.contentSlides,
  sprintNodes: onboardingOp.sprintNodes,
});

const ONBOARDING_DECK = createDeckPreset({
  id: "onboarding",
  themeId: onboarding.themeId,
  ...onboarding.deckMeta,
  topics: onboarding.contentSlides,
  sprintNodes: onboarding.sprintNodes,
});

const ENGINEERING_DECK = createDeckPreset({
  id: "engineering",
  themeId: engineering.themeId,
  ...engineering.deckMeta,
  topics: engineering.contentSlides,
  sprintNodes: engineering.sprintNodes,
});

export const DECKS: Record<string, DeckData> = {
  current: CURRENT_DECK,
  genai: GENAI_MANIFEST_DECK,
  "verge-pop": VERGE_POP_DECK,
  onboarding: ONBOARDING_DECK,
  "onboarding-op": ONBOARDING_OP_DECK,
  studio: STUDIO_DECK,
  engineering: ENGINEERING_DECK,
};

/**
 * Deck summaries for the ControlPanel deck picker — narrows each full deck
 * preset down to the `DeckMeta` fields the UI consumes. Built from `DECKS`
 * so it stays in sync, and gives the `decks` prop a real `Record<string, DeckMeta>`
 * type with no cast at the call site.
 */
export const DECK_SUMMARIES: Record<string, DeckMeta> = Object.fromEntries(
  Object.entries(DECKS).map(([key, d]) => [
    key,
    { title: d.title, titleAccent: d.titleAccent },
  ]),
);
