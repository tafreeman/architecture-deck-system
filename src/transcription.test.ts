import { describe, it, expect } from "vitest";

import {
  transcribeTopic,
  BASE_LAYOUTS,
  VERGE_LAYOUTS,
  HANDBOOK_LAYOUTS,
  ADV_LAYOUTS,
  ADVD_LAYOUTS,
  type Topic,
} from "./transcription.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Create a minimal Topic object */
function topic(layout: string, extra: Record<string, unknown> = {}): Topic {
  return { layout, title: "Test Title", ...extra };
}

// ── Identity: target family already owns the layout → topic returned unchanged ─

describe("transcribeTopic — identity (no-op) when layout is already in target family", () => {
  it("base layout in base family is returned as-is (two-col)", () => {
    const t = topic("two-col", { summary: "original" });
    expect(transcribeTopic(t, "base")).toBe(t);
  });

  it("base layout in base family is returned as-is (stat-cards)", () => {
    const t = topic("stat-cards");
    expect(transcribeTopic(t, "base")).toBe(t);
  });

  it("verge layout in verge family is returned as-is (stat-hero)", () => {
    const t = topic("stat-hero");
    expect(transcribeTopic(t, "verge")).toBe(t);
  });

  it("handbook layout in handbook family is returned as-is (hb-chapter)", () => {
    const t = topic("hb-chapter");
    expect(transcribeTopic(t, "handbook")).toBe(t);
  });

  it("advocacy layout in advocacy family is returned as-is (adv-future)", () => {
    const t = topic("adv-future");
    expect(transcribeTopic(t, "advocacy")).toBe(t);
  });

  it("advocacy-dense layout in advocacy-dense family is returned as-is (advd-future)", () => {
    const t = topic("advd-future");
    expect(transcribeTopic(t, "advocacy-dense")).toBe(t);
  });

  it("unknown layout with base target falls through to default — returns input unchanged", () => {
    const t = topic("completely-unknown-layout");
    expect(transcribeTopic(t, "base")).toBe(t);
  });

  it("unknown layout with verge target falls through to default — returns input unchanged", () => {
    const t = topic("completely-unknown-layout");
    expect(transcribeTopic(t, "verge")).toBe(t);
  });
});

// ── Cross-family: info-cards → base ─────────────────────────────────────────

describe("transcribeTopic — info-cards → base", () => {
  const cards = [
    { stat: "10x", statLabel: "Speed", title: "Fast", body: "Very fast" },
    { stat: "99%", statLabel: "Uptime", title: "Reliable", body: "Always on" },
  ];
  const input = topic("info-cards", { banner: "Banner text", order: 2, cards });

  it("produces layout: stat-cards", () => {
    const result = transcribeTopic(input, "base");
    expect(result.layout).toBe("stat-cards");
  });

  it("does not mutate the original topic", () => {
    const frozen = Object.freeze({ ...input, cards: input.cards });
    // transcribeTopic should work even with frozen outer object
    const result = transcribeTopic(frozen as Topic, "base");
    expect(frozen.layout).toBe("info-cards");
    expect(result).not.toBe(frozen);
  });

  it("maps cards to expected shape with title preserved", () => {
    const result = transcribeTopic(input, "base") as typeof input & {
      cards: Array<{ title: string; step: string; eyebrow: string; body: string }>;
    };
    expect(result.cards).toHaveLength(cards.length);
    expect(result.cards[0].title).toBe("Fast");
    expect(result.cards[1].title).toBe("Reliable");
  });

  it("sets kicker from order field", () => {
    const result = transcribeTopic(input, "base") as Record<string, unknown>;
    expect(result.kicker).toBe("Module 2");
  });

  it("leadershipPoints length equals number of cards", () => {
    const result = transcribeTopic(input, "base") as Record<string, unknown>;
    expect((result.leadershipPoints as unknown[]).length).toBe(cards.length);
  });
});

// ── Cross-family: adv-future → base ──────────────────────────────────────────

describe("transcribeTopic — adv-future → base", () => {
  const cards = [
    { title: "Vision A", body: "body a" },
    { title: "Vision B", body: "body b" },
  ];
  const input = topic("adv-future", { cards, callout: "big future" });

  it("produces layout: h-strip", () => {
    expect(transcribeTopic(input, "base").layout).toBe("h-strip");
  });

  it("preserves the cards array reference in result", () => {
    const result = transcribeTopic(input, "base") as Record<string, unknown>;
    expect(result.cards).toBe(cards);
  });

  it("preserves callout", () => {
    const result = transcribeTopic(input, "base") as Record<string, unknown>;
    expect(result.callout).toBe("big future");
  });
});

// ── Cross-family: advd-future → base (same as adv-future → base) ─────────────

describe("transcribeTopic — advd-future → base", () => {
  const cards = [{ title: "X", body: "" }];
  const input = topic("advd-future", { cards, callout: "advd callout" });

  it("produces layout: h-strip (advd-future shares the adv-future branch)", () => {
    expect(transcribeTopic(input, "base").layout).toBe("h-strip");
  });
});

// ── Cross-family: adv-overview → base ────────────────────────────────────────

describe("transcribeTopic — adv-overview → base", () => {
  const heroPoints = ["point 1", "point 2"];
  const cards = [{ title: "C1", body: "b1" }];
  const input = topic("adv-overview", { heroPoints, cards, talkingPoints: ["tp1"] });

  it("produces layout: two-col", () => {
    expect(transcribeTopic(input, "base").layout).toBe("two-col");
  });

  it("preserves heroPoints and cards in result", () => {
    const result = transcribeTopic(input, "base") as Record<string, unknown>;
    expect(result.heroPoints).toBe(heroPoints);
    expect(result.cards).toBe(cards);
  });
});

// ── Cross-family: advocacy-dense prefix replacement ──────────────────────────

describe("transcribeTopic — advocacy-dense rewrites adv- prefix to advd-", () => {
  it("two-col → advocacy-dense produces an advd- layout", () => {
    const t = topic("two-col", { heroPoints: [], cards: [], talkingPoints: [] });
    const result = transcribeTopic(t, "advocacy-dense");
    expect(result.layout).toMatch(/^advd-/);
  });

  it("stat-cards → advocacy-dense produces an advd- layout", () => {
    const t = topic("stat-cards", { cards: [] });
    const result = transcribeTopic(t, "advocacy-dense");
    expect(result.layout).toMatch(/^advd-/);
  });

  it("h-strip → advocacy → advocacy-dense produces advd-future", () => {
    const t = topic("h-strip", { cards: [], callout: "" });
    const result = transcribeTopic(t, "advocacy-dense");
    expect(result.layout).toBe("advd-future");
  });

  it("before-after → advocacy-dense produces advd-hurdles", () => {
    const t = topic("before-after", { cards: [] });
    const result = transcribeTopic(t, "advocacy-dense");
    expect(result.layout).toBe("advd-hurdles");
  });
});

// ── Cross-family: two-col → verge ─────────────────────────────────────────────

describe("transcribeTopic — two-col → verge", () => {
  const cards = [{ title: "C1", body: "b1" }, { title: "C2", body: "b2" }];
  const input = topic("two-col", { cards });

  it("produces layout: color-blocks", () => {
    expect(transcribeTopic(input, "verge").layout).toBe("color-blocks");
  });

  it("maps cards to blocks preserving title as label", () => {
    const result = transcribeTopic(input, "verge") as Record<string, unknown>;
    const blocks = result.blocks as Array<{ label: string; body: string; value: string }>;
    expect(blocks).toHaveLength(cards.length);
    expect(blocks[0].label).toBe("C1");
    expect(blocks[1].label).toBe("C2");
  });
});

// ── Cross-family: two-col → handbook ──────────────────────────────────────────

describe("transcribeTopic — two-col → handbook", () => {
  const cards = [{ title: "Ch1", body: "Sub 1" }, { title: "Ch2", body: "Sub 2" }];
  const input = topic("two-col", { cards, summary: "overview" });

  it("produces layout: hb-chapter", () => {
    expect(transcribeTopic(input, "handbook").layout).toBe("hb-chapter");
  });

  it("maps cards to chapters preserving title", () => {
    const result = transcribeTopic(input, "handbook") as Record<string, unknown>;
    const chapters = result.chapters as Array<{ num: string; title: string; sub: string }>;
    expect(chapters).toHaveLength(cards.length);
    expect(chapters[0].title).toBe("Ch1");
    expect(chapters[1].title).toBe("Ch2");
  });
});

// ── Cross-family: adv-future → advocacy-dense (via transcribeToAdvocacyDense) ─

describe("transcribeTopic — advocacy-dense is a superset of advocacy", () => {
  it("adv-layout → advocacy-dense produces corresponding advd- layout", () => {
    // adv-overview is already in ADV_LAYOUTS so it should be transcribed
    // (it is NOT in ADVD_LAYOUTS, so advocacy-dense will transcribe it)
    const t = topic("adv-overview", { heroPoints: [], cards: [], talkingPoints: [] });
    const result = transcribeTopic(t, "advocacy-dense");
    expect(result.layout).toBe("advd-overview");
  });
});

// ── Layout set exports are correct Sets ───────────────────────────────────────

describe("layout set constants", () => {
  it("BASE_LAYOUTS is a Set containing known base layouts", () => {
    expect(BASE_LAYOUTS).toBeInstanceOf(Set);
    expect(BASE_LAYOUTS.has("two-col")).toBe(true);
    expect(BASE_LAYOUTS.has("stat-cards")).toBe(true);
    expect(BASE_LAYOUTS.has("h-strip")).toBe(true);
  });

  it("VERGE_LAYOUTS is a Set containing known verge layouts", () => {
    expect(VERGE_LAYOUTS).toBeInstanceOf(Set);
    expect(VERGE_LAYOUTS.has("stat-hero")).toBe(true);
    expect(VERGE_LAYOUTS.has("color-blocks")).toBe(true);
  });

  it("HANDBOOK_LAYOUTS is a Set containing known handbook layouts", () => {
    expect(HANDBOOK_LAYOUTS).toBeInstanceOf(Set);
    expect(HANDBOOK_LAYOUTS.has("hb-chapter")).toBe(true);
    expect(HANDBOOK_LAYOUTS.has("hb-manifesto")).toBe(true);
  });

  it("ADV_LAYOUTS contains adv- prefix layouts", () => {
    expect(ADV_LAYOUTS).toBeInstanceOf(Set);
    for (const id of ADV_LAYOUTS) {
      expect(id).toMatch(/^adv-/);
    }
  });

  it("ADVD_LAYOUTS contains advd- prefix layouts", () => {
    expect(ADVD_LAYOUTS).toBeInstanceOf(Set);
    for (const id of ADVD_LAYOUTS) {
      expect(id).toMatch(/^advd-/);
    }
  });
});
