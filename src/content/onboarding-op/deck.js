// ─── Onboarding One-Pager Deck ───
// Reuses all onboarding content remapped to dense op-* one-pager layouts.
import { contentSlides as src, sprintNodes } from "../onboarding/deck.js";
export { sprintNodes };
export const themeId = "linear";

const LAYOUT_MAP = {
  "info-cards": "op-brief",
  "checklist":  "op-brief",
  "workflow":   "op-flow",
  "pillars":    "op-brief",
  "catalog":    "op-flow",
};

export const contentSlides = src.map(slide => ({
  ...slide,
  layout: LAYOUT_MAP[slide.layout] || "op-brief",
}));

/** Deck-level text metadata (mirrors the deckMeta shape from mergeDeckContent). */
export const deckMeta = {
  brandLine: "GenAI Delivery",
  title: "Onboarding",
  titleAccent: "One-Pagers",
  tagline: "Seven modules as dense one-pager briefs. Select a topic.",
  introBrandLine: "GenAI Delivery · One-Pagers",
  introTitle: "AI-Assisted Development",
  introSubtitle: "One-pager format — all key info on a single screen",
  introStats: [
    { val: "7", lbl: "Modules", color: "#F97316" },
    { val: "Op", lbl: "One-Pager", color: "#FBBF24" },
    { val: "Dense", lbl: "Format", color: "#A855F7" },
    { val: "Fast", lbl: "Scan", color: "#22C55E" },
  ],
  stats: [
    { val: "7", lbl: "Modules" },
    { val: "2", lbl: "Layout Types" },
    { val: "Dense", lbl: "One-Pager Format" },
    { val: "Fast", lbl: "At-a-Glance" },
  ],
};
