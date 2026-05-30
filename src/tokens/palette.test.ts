import { describe, it, expect } from "vitest";

import {
  lightenHex,
  hexToGlow,
  buildPalette,
  resolveSlideColor,
  resolveTopicColors,
  resolveIntroStatColors,
  type IntroStat,
} from "./palette.ts";
import { THEMES_BY_ID } from "./themes.ts";

// Pick a real theme to drive all palette tests
const theme = THEMES_BY_ID["midnight-teal"];

describe("lightenHex", () => {
  it("returns the same colour when amount is 0 (no lightening)", () => {
    expect(lightenHex("#000000", 0)).toBe("#000000");
  });

  it("returns white (#ffffff) for full-black at amount=1", () => {
    expect(lightenHex("#000000", 1)).toBe("#ffffff");
  });

  it("returns white for white at any amount (already at 255)", () => {
    expect(lightenHex("#ffffff", 0.5)).toBe("#ffffff");
  });

  it("output always matches the hex colour format", () => {
    for (const color of [theme.accent, theme.gradient[0], theme.gradient[1]]) {
      expect(lightenHex(color, 0.3)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("lightened colour is not darker than the original (channels >=)", () => {
    const original = "#3366cc";
    const result = lightenHex(original, 0.3);
    const origR = parseInt(original.slice(1, 3), 16);
    const origG = parseInt(original.slice(3, 5), 16);
    const origB = parseInt(original.slice(5, 7), 16);
    const resR = parseInt(result.slice(1, 3), 16);
    const resG = parseInt(result.slice(3, 5), 16);
    const resB = parseInt(result.slice(5, 7), 16);
    expect(resR).toBeGreaterThanOrEqual(origR);
    expect(resG).toBeGreaterThanOrEqual(origG);
    expect(resB).toBeGreaterThanOrEqual(origB);
  });
});

describe("hexToGlow", () => {
  it("converts pure black with default alpha=0.25", () => {
    expect(hexToGlow("#000000")).toBe("rgba(0,0,0,0.25)");
  });

  it("converts pure white with explicit alpha=1", () => {
    expect(hexToGlow("#ffffff", 1)).toBe("rgba(255,255,255,1)");
  });

  it("output always matches rgba format", () => {
    for (const color of [theme.accent, theme.gradient[0], theme.success, theme.danger]) {
      expect(hexToGlow(color)).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
    }
  });

  it("encodes RGB channels correctly from a known hex", () => {
    // #ff8000 → r=255 g=128 b=0
    expect(hexToGlow("#ff8000", 0.5)).toBe("rgba(255,128,0,0.5)");
  });
});

describe("buildPalette", () => {
  it("returns an array of non-empty strings", () => {
    const palette = buildPalette(theme);
    expect(palette.length).toBeGreaterThan(0);
    palette.forEach((c) => expect(typeof c).toBe("string"));
    palette.forEach((c) => expect(c.length).toBeGreaterThan(0));
  });

  it("includes the theme accent as the first entry", () => {
    const palette = buildPalette(theme);
    expect(palette[0]).toBe(theme.accent);
  });

  it("contains at least the accent, both gradient stops, success, warning and danger tokens", () => {
    const palette = buildPalette(theme);
    expect(palette).toContain(theme.accent);
    expect(palette).toContain(theme.gradient[0]);
    expect(palette).toContain(theme.gradient[1]);
    expect(palette).toContain(theme.success);
    expect(palette).toContain(theme.warning);
    expect(palette).toContain(theme.danger);
  });
});

describe("resolveSlideColor", () => {
  it("resolves color/colorLight/colorGlow for index 0", () => {
    const result = resolveSlideColor(theme, 0);
    expect(result).toHaveProperty("color");
    expect(result).toHaveProperty("colorLight");
    expect(result).toHaveProperty("colorGlow");
  });

  it("color at index N equals palette[N % len]", () => {
    const palette = buildPalette(theme);
    for (let i = 0; i < palette.length + 2; i++) {
      const result = resolveSlideColor(theme, i);
      expect(result.color).toBe(palette[i % palette.length]);
    }
  });

  it("colorLight is a valid hex string", () => {
    const result = resolveSlideColor(theme, 0);
    expect(result.colorLight).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("colorGlow is a valid rgba string", () => {
    const result = resolveSlideColor(theme, 0);
    expect(result.colorGlow).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
  });

  it("colorLight and colorGlow are derived from the base color at that index", () => {
    const palette = buildPalette(theme);
    const idx = 2;
    const base = palette[idx % palette.length];
    const result = resolveSlideColor(theme, idx);
    expect(result.color).toBe(base);
    expect(result.colorLight).toBe(lightenHex(base, 0.3));
    expect(result.colorGlow).toBe(hexToGlow(base, 0.25));
  });
});

describe("resolveTopicColors", () => {
  it("returns a new array — does not mutate the input", () => {
    const topics = [{ layout: "two-col", title: "A" }, { layout: "stat-cards", title: "B" }] as const;
    const result = resolveTopicColors(topics, theme);
    expect(result).not.toBe(topics);
    expect(topics[0]).not.toHaveProperty("color");
    expect(topics[0]).not.toHaveProperty("colorLight");
    expect(topics[0]).not.toHaveProperty("colorGlow");
  });

  it("each output topic has color/colorLight/colorGlow", () => {
    const topics = [{ layout: "two-col" }, { layout: "stat-cards" }, { layout: "h-strip" }];
    const result = resolveTopicColors(topics, theme);
    for (const slide of result) {
      expect(slide).toHaveProperty("color");
      expect(slide).toHaveProperty("colorLight");
      expect(slide).toHaveProperty("colorGlow");
    }
  });

  it("preserves original topic fields in the result", () => {
    const topics = [{ layout: "two-col", title: "Hello", customProp: 42 }];
    const result = resolveTopicColors(topics, theme);
    expect(result[0].title).toBe("Hello");
    expect(result[0].customProp).toBe(42);
  });

  it("assigns palette colors by index using rotation", () => {
    const palette = buildPalette(theme);
    const topics = Array.from({ length: palette.length + 1 }, (_, i) => ({
      layout: "two-col",
      idx: i,
    }));
    const result = resolveTopicColors(topics, theme);
    result.forEach((slide, i) => {
      expect(slide.color).toBe(palette[i % palette.length]);
    });
  });

  it("handles an empty topics array without error", () => {
    expect(resolveTopicColors([], theme)).toEqual([]);
  });
});

describe("resolveIntroStatColors", () => {
  const stats: IntroStat[] = [
    { val: "10x", lbl: "Faster", color: "" },
    { val: "99%", lbl: "Uptime", color: "" },
    { val: "50+", lbl: "Clients", color: "" },
  ];

  it("returns a new array — does not mutate the input", () => {
    const original = stats.map((s) => ({ ...s }));
    resolveIntroStatColors(stats, theme);
    stats.forEach((s, i) => {
      expect(s.color).toBe(original[i].color);
    });
  });

  it("each stat color equals palette[idx % len]", () => {
    const palette = buildPalette(theme);
    const result = resolveIntroStatColors(stats, theme);
    result.forEach((stat, idx) => {
      expect(stat.color).toBe(palette[idx % palette.length]);
    });
  });

  it("preserves val and lbl fields", () => {
    const result = resolveIntroStatColors(stats, theme);
    result.forEach((stat, i) => {
      expect(stat.val).toBe(stats[i].val);
      expect(stat.lbl).toBe(stats[i].lbl);
    });
  });

  it("handles a single stat without error", () => {
    const palette = buildPalette(theme);
    const single: IntroStat[] = [{ val: "1", lbl: "Item", color: "" }];
    const result = resolveIntroStatColors(single, theme);
    expect(result[0].color).toBe(palette[0]);
  });

  it("handles an empty array without error", () => {
    expect(resolveIntroStatColors([], theme)).toEqual([]);
  });
});
