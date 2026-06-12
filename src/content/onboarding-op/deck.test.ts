/**
 * onboarding-op/deck.test.ts — drift guard for onboarding-op deckMeta.
 *
 * onboarding-op/deck.js maintains a hand-written deckMeta literal while
 * every other deck derives its deckMeta from a content.json deck block via
 * mergeDeckContent. This test asserts that the fields which should stay
 * consistent with the canonical onboarding/content.json deck block actually do,
 * so a change in one place is automatically flagged in the other.
 *
 * Strategy chosen: vitest comparison (lower risk than restructuring deck.js,
 * which has a different architecture — it derives contentSlides by re-mapping
 * the onboarding deck's slides, not by reading a structure file).
 */

import { describe, it, expect } from "vitest";

// The hand-maintained metadata
import { deckMeta as opDeckMeta } from "./deck.js";

// The canonical content that onboarding-op conceptually mirrors
import onboardingContent from "../onboarding/content.json" with { type: "json" };

const canonical = onboardingContent.deck;

describe("onboarding-op deckMeta — drift guard vs onboarding/content.json", () => {
  it("brandLine matches the canonical onboarding deck (shared identity)", () => {
    // Both decks represent GenAI Delivery onboarding; brandLine must stay in sync.
    expect(opDeckMeta.brandLine).toBe(canonical.brandLine);
  });

  it("title matches the canonical onboarding deck title", () => {
    // The title identifies the content domain — should never diverge silently.
    expect(opDeckMeta.title).toBe(canonical.title);
  });

  it("introTitle matches the canonical onboarding deck introTitle", () => {
    // Both formats introduce the same course; the intro heading must stay aligned.
    expect(opDeckMeta.introTitle).toBe(canonical.introTitle);
  });

  it("module count in introStats[0].val matches canonical (both reflect 7 modules)", () => {
    // The number of modules is a structural fact shared by both decks.
    // Computed comparison: derive from canonical rather than a literal.
    const canonicalModuleCount = canonical.introStats[0]?.val;
    expect(opDeckMeta.introStats[0]?.val).toBe(canonicalModuleCount);
  });
});
