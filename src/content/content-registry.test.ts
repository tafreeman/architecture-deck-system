/**
 * content-registry.test.ts — runtime deck-building contract tests.
 *
 * Exercises buildDeckFromContent over real (registered) deck + content-pack
 * combinations, asserting it returns a merged deck with non-empty
 * contentSlides, and that it returns null for unknown deck/content IDs.
 *
 * register-all is imported as a side-effect so validateLayoutsExist (called
 * inside buildDeckFromContent) sees the real, fully-populated layout registry.
 */

import { describe, it, expect } from "vitest";

// Populate the layout registry — buildDeckFromContent validates against it.
import "../layouts/register-all.ts";

import {
  buildDeckFromContent,
  isContentSwappable,
  getDefaultContentId,
  getAvailableContent,
} from "./content-registry.ts";

// ── buildDeckFromContent — real deck+content combos ─────────────────────────

describe("buildDeckFromContent — registered deck + content combos", () => {
  // Two real combinations: each deck applied with its own default content pack.
  const combos: ReadonlyArray<[string, string]> = [
    ["current", "current"],
    ["engineering", "engineering"],
  ];

  for (const [deckKey, contentId] of combos) {
    it(`builds a non-empty deck for ${deckKey} + ${contentId}`, () => {
      const merged = buildDeckFromContent(deckKey, contentId);
      expect(merged).not.toBeNull();
      expect(merged?.contentSlides.length).toBeGreaterThan(0);
      // Every built slide must carry the structural fields the renderer relies on.
      for (const slide of merged!.contentSlides) {
        expect(slide.id).toBeTruthy();
        expect(slide.layout).toBeTruthy();
      }
      // The deck-level metadata block must be present.
      expect(merged?.deckMeta.title).toBeTruthy();
    });
  }

  it("cross-applies one deck's structure with another deck's content pack", () => {
    // Graceful-fallback design: any content pack can be applied to any structure.
    const merged = buildDeckFromContent("current", "engineering");
    expect(merged).not.toBeNull();
    expect(merged?.contentSlides.length).toBeGreaterThan(0);
  });
});

// ── buildDeckFromContent — unknown IDs ──────────────────────────────────────

describe("buildDeckFromContent — unknown IDs return null", () => {
  it("returns null for an unknown deck key", () => {
    expect(buildDeckFromContent("no-such-deck", "current")).toBeNull();
  });

  it("returns null for an unknown content id", () => {
    expect(buildDeckFromContent("current", "no-such-content")).toBeNull();
  });

  it("returns null when both ids are unknown / empty", () => {
    expect(buildDeckFromContent("", "")).toBeNull();
  });
});

// ── Companion helpers (sanity guards for the combos above) ───────────────────

describe("content-registry helpers", () => {
  it("reports registered decks as content-swappable", () => {
    expect(isContentSwappable("current")).toBe(true);
    expect(isContentSwappable("engineering")).toBe(true);
  });

  it("reports unregistered decks as not swappable", () => {
    expect(isContentSwappable("no-such-deck")).toBe(false);
  });

  it("returns the default content id for a registered deck", () => {
    expect(getDefaultContentId("current")).toBe("current");
  });

  it("returns null default content id for an unregistered deck", () => {
    expect(getDefaultContentId("no-such-deck")).toBeNull();
  });

  it("lists available content packs with match counts for a registered deck", () => {
    const available = getAvailableContent("current");
    expect(available.length).toBeGreaterThan(0);
    // The deck's own pack should match all its slides.
    const ownPack = available.find((p) => p.id === "current");
    expect(ownPack).toBeDefined();
    expect(ownPack!.matchCount).toBe(ownPack!.totalSlides);
  });
});
