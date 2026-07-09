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
  CONTENT_PACKS,
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

  it("cross-applies one deck's structure with another deck's content pack, pulling in that pack's own text", () => {
    // Graceful-fallback design: any content pack can be applied to any structure.
    // A trivial "renders and is non-empty" assertion can't distinguish a real
    // swap from a no-op that silently kept the structure's own content — so
    // this compares the cross-applied merge against the deck's own-content
    // merge and requires actual text to differ, then traces every changed
    // title back to the source pack's own data (never a hardcoded literal).
    const ownMerge = buildDeckFromContent("current", "current");
    const crossMerge = buildDeckFromContent("current", "engineering");
    expect(ownMerge).not.toBeNull();
    expect(crossMerge).not.toBeNull();
    expect(crossMerge?.contentSlides.length).toBeGreaterThan(0);

    const ownTitleById = new Map(ownMerge!.contentSlides.map((s) => [s.id, s.title]));
    const crossTitleById = new Map(crossMerge!.contentSlides.map((s) => [s.id, s.title]));
    const matchMethodById = new Map(crossMerge!.contentSlides.map((s) => [s.id, s.matchMethod]));

    // At least one slide must resolve to different text once the content pack
    // is swapped — otherwise "cross-apply" would be indistinguishable from
    // applying the deck's own content.
    const changedSlideIds = [...crossTitleById.keys()].filter(
      (id) => crossTitleById.get(id) !== ownTitleById.get(id),
    );
    expect(changedSlideIds.length).toBeGreaterThan(0);

    // Every changed title must be traceable to either the engineering pack's
    // own text (a real substitution) or the structure's own label (tier-5
    // "structure-only" fallback, when no engineering slide matched) — never
    // some other unexplained value.
    const engineeringTitles = new Set(
      Object.values(CONTENT_PACKS.engineering.data.slides).map((s) => s.title),
    );
    for (const id of changedSlideIds) {
      const resolvedTitle = crossTitleById.get(id);
      const isStructureOnlyFallback = matchMethodById.get(id) === "none";
      expect(
        engineeringTitles.has(resolvedTitle as string) || isStructureOnlyFallback,
        `slide "${id}" resolved to "${resolvedTitle}" (matchMethod=${matchMethodById.get(id)}), ` +
          `which is neither an engineering-pack title nor a structure-only label`,
      ).toBe(true);
    }
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
