/**
 * content-pack-validity.test.ts — CI gate over every registered content.json.
 *
 * validateContentPack() (schema.ts) is deliberately soft at runtime — it
 * warns and lets the presenter keep running on a malformed pack. That's the
 * right UX for a live demo, but it means a broken content.json can otherwise
 * ship silently. This test closes that gap: it imports the exact same
 * content.json packs content-registry.ts imports and asserts every one of
 * them via assertContentPackValid (the throwing sibling), so `npm test`
 * fails the build if any registered pack is invalid.
 *
 * NOTE: this import list is intentionally a mirror of the CONTENT_PACKS
 * imports in ../../content/content-registry.ts. If a new content pack is
 * registered there, add its content.json import here too — otherwise it
 * ships without this CI gate.
 */

import { describe, it, expect } from "vitest";

import { assertContentPackValid } from "./schema.ts";

// ── Same content.json packs content-registry.ts registers ──────────────────
import currentContent from "../../content/current/content.json";
import genaiContent from "../../content/genai-advocacy/content.json";
import engineeringContent from "../../content/engineering/content.json";
import onboardingContent from "../../content/onboarding/content.json";
import vergePopContent from "../../content/verge-pop/content.json";
import studioContent from "../../content/studio/content.json";

const REGISTERED_PACKS: ReadonlyArray<[string, unknown]> = [
  ["current", currentContent],
  ["genai", genaiContent],
  ["engineering", engineeringContent],
  ["onboarding", onboardingContent],
  ["verge-pop", vergePopContent],
  ["studio", studioContent],
];

describe("assertContentPackValid — every registered content pack", () => {
  for (const [id, data] of REGISTERED_PACKS) {
    it(`"${id}" content.json is schema-valid`, () => {
      expect(() => assertContentPackValid(id, data)).not.toThrow();
    });
  }
});

describe("assertContentPackValid — throws on malformed input", () => {
  it("throws when a required deck field is missing and a slide field has the wrong type", () => {
    // Deliberately malformed fixture: `deck.title` is missing (required by
    // DeckMetaSchema) and `slides.broken.order` is a string, not a number
    // (required by SlideSchema). Either defect alone is enough to fail
    // ContentPackDataSchema.safeParse — both together prove the assert
    // surfaces real schema violations, not just an empty-object case.
    const malformedPack = {
      deck: {
        brandLine: "Missing Title Brand",
      },
      slides: {
        broken: {
          id: "broken",
          order: "not-a-number",
          layout: "two-col",
        },
      },
    };

    expect(() => assertContentPackValid("malformed-fixture", malformedPack)).toThrow(
      /\[ContentPack "malformed-fixture"\] invalid/,
    );
  });

  it("includes the flattened Zod error detail in the thrown message", () => {
    const malformedPack = {
      deck: {}, // missing brandLine AND title
      slides: {},
    };

    try {
      assertContentPackValid("empty-deck", malformedPack);
      expect.unreachable("assertContentPackValid should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      const message = (err as Error).message;
      expect(message).toContain("empty-deck");
      // Flattened Zod errors report the failing path under fieldErrors.
      expect(message).toContain("fieldErrors");
    }
  });
});
