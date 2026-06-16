/**
 * schema.test.ts — runtime-validation contract tests for the deck schemas.
 *
 * Covers the two validators wired into content-registry.ts:
 *   - validateLayoutsExist  — throws on unknown layout IDs, passes on valid ones
 *   - validateContentPack   — warns (never throws) on a malformed content pack,
 *                             stays silent on a valid one
 * Plus a `.passthrough()` scenario proving deck-specific extra fields survive
 * validation without tripping the schema.
 */

import { describe, it, expect, vi } from "vitest";

import {
  validateLayoutsExist,
  validateContentPack,
  ContentPackDataSchema,
} from "./schema.ts";

// ── Fixtures ────────────────────────────────────────────────────────────────

/** A registry stub: only "two-col" and "stat-cards" are "registered". */
const registryStub = {
  has: (id: string) => id === "two-col" || id === "stat-cards",
  list: () => ["two-col", "stat-cards"],
};

/** A minimal valid content pack (deck block + one well-formed slide). */
const validPack = {
  deck: {
    brandLine: "Test Brand",
    title: "Test Deck",
  },
  slides: {
    overview: {
      id: "overview",
      order: 1,
      layout: "two-col",
      title: "Overview",
    },
  },
};

// ── validateLayoutsExist ────────────────────────────────────────────────────

describe("validateLayoutsExist", () => {
  it("passes when every slide layout is registered", () => {
    const manifest = {
      slides: [
        { id: "a", layout: "two-col" },
        { id: "b", layout: "stat-cards" },
      ],
    };
    expect(() => validateLayoutsExist(manifest, registryStub)).not.toThrow();
  });

  it("throws when a slide references an unknown layout", () => {
    const manifest = {
      slides: [
        { id: "a", layout: "two-col" },
        { id: "b", layout: "no-such-layout" },
      ],
    };
    expect(() => validateLayoutsExist(manifest, registryStub)).toThrow(
      /Unknown layouts in deck manifest/,
    );
  });

  it("names the offending slide and layout in the thrown error", () => {
    const manifest = { slides: [{ id: "broken-slide", layout: "ghost" }] };
    expect(() => validateLayoutsExist(manifest, registryStub)).toThrow(
      /"ghost" \(slide broken-slide\)/,
    );
  });
});

// ── validateContentPack ─────────────────────────────────────────────────────

describe("validateContentPack", () => {
  it("stays silent (no warning) for a valid content pack", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    validateContentPack("good-pack", validPack);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns (never throws) for a malformed content pack", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    // `deck.title` missing and `slides.broken.order` is the wrong type.
    const badPack = {
      deck: { brandLine: "No Title Here" },
      slides: {
        broken: { id: "broken", order: "not-a-number", layout: "two-col" },
      },
    };
    expect(() => validateContentPack("bad-pack", badPack)).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
    // The pack id is surfaced in the warning so authors can locate it.
    expect(warn.mock.calls[0][0]).toContain("bad-pack");
    warn.mockRestore();
  });
});

// ── .passthrough() behaviour ────────────────────────────────────────────────

describe("ContentPackDataSchema — passthrough", () => {
  it("preserves deck-specific extra fields not declared in the schema", () => {
    const packWithExtras = {
      deck: {
        brandLine: "Brand",
        title: "Title",
        // Extra field not in DeckMetaSchema — must survive via .passthrough().
        customDeckField: "kept",
      },
      slides: {
        overview: {
          id: "overview",
          order: 1,
          layout: "two-col",
          // Extra slide field not in SlideSchema — must survive too.
          experimentalFlag: true,
        },
      },
    };

    const result = ContentPackDataSchema.safeParse(packWithExtras);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deck.customDeckField).toBe("kept");
      expect(result.data.slides.overview.experimentalFlag).toBe(true);
    }
  });
});
