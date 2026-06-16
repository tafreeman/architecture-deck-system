import { describe, it, expect } from "vitest";

import { normalizeDeckTopics, normalizeSprintNodes } from "./decks.ts";

// These normalizers are applied to BOTH the static deck presets (createDeckPreset)
// and to content swapped at runtime by useDeckState. Runtime swaps must get the
// same num / icon / color defaults the static decks rely on — this is the
// regression guard for the "swapped content bypasses normalization" bug.
describe("deck normalizers", () => {
  it("fills num, icon, and color defaults on bare slides", () => {
    const [slide] = normalizeDeckTopics([
      { id: "s1", layout: "two-col", color: "#abcdef" },
    ]);
    expect(slide.num).toBe("01");
    expect(slide.icon).toBeTruthy(); // registered layout icon, or the "•" fallback
    expect(slide.colorLight).toBe("#abcdef");
    expect(slide.colorGlow).toBe("#abcdef33");
    expect(slide.cards).toEqual([]);
  });

  it("preserves values that are already set", () => {
    const [slide] = normalizeDeckTopics([
      { id: "s1", num: "07", icon: "★", color: "#111111", colorLight: "#222222" },
    ]);
    expect(slide.num).toBe("07");
    expect(slide.icon).toBe("★");
    expect(slide.colorLight).toBe("#222222");
  });

  it("falls back to the bullet icon for an unknown sprint-node abbr", () => {
    const [node] = normalizeSprintNodes([{ abbr: "ZZ" }]);
    expect(node.icon).toBe("•");
  });
});
