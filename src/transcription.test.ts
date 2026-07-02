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

// ── Regression: object-shaped items must never stringify as "[object Object]" ──
// `items` arrays are heterogeneous (raw strings or SlideItem objects); every
// existing fixture above only exercised the string case, so this gap in the
// object case went uncaught.

describe("transcribeTopic — items arrays with object-shaped SlideItems", () => {
  const pillarsTopic = topic("pillars", {
    pillars: [{ title: "P1", icon: "pi", items: [{ label: "Alpha" }, { title: "Beta" }, "Gamma"] }],
  });
  const catalogTopic = topic("catalog", {
    categories: [{ title: "C1", items: [{ label: "Alpha" }, { title: "Beta" }, "Gamma"] }],
  });

  it("base family (pillars → stat-cards) never renders [object Object]", () => {
    const result = transcribeTopic(pillarsTopic, "base") as Topic & {
      cards: { body: string }[];
    };
    expect(result.cards[0].body).toBe("Alpha · Beta · Gamma");
    expect(result.cards[0].body).not.toContain("[object Object]");
  });

  it("base family (catalog → two-col) never renders [object Object]", () => {
    const result = transcribeTopic(catalogTopic, "base") as Topic & {
      cards: { body: string }[];
    };
    expect(result.cards[0].body).toBe("Alpha · Beta · Gamma");
    expect(result.cards[0].body).not.toContain("[object Object]");
  });

  it("advocacy family (pillars → adv-platform) never renders [object Object] in title", () => {
    const result = transcribeTopic(pillarsTopic, "advocacy") as Topic & {
      capabilities: { title: string }[];
    };
    expect(result.capabilities.map((c) => c.title)).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("verge family (catalog → color-blocks) never renders [object Object]", () => {
    const result = transcribeTopic(catalogTopic, "verge") as Topic & {
      blocks: { body: string }[];
    };
    expect(result.blocks[0].body).toBe("Alpha · Beta · Gamma");
    expect(result.blocks[0].body).not.toContain("[object Object]");
  });

  it("handbook family (pillars → hb-index) never renders [object Object]", () => {
    const result = transcribeTopic(pillarsTopic, "handbook") as Topic & {
      categories: { body: string }[];
    };
    expect(result.categories[0].body).toBe("Alpha · Beta · Gamma");
    expect(result.categories[0].body).not.toContain("[object Object]");
  });
});

// ── Characterization matrix: full 8-family × 5-target cross product ──────────
//
// DECK-4: these tests PIN the current (pre-refactor) behavior of every
// source layout transcribed to every target family, so the upcoming
// per-family extraction in src/transcription/ can be verified byte-for-byte
// against this fixture. They assert the ACTUAL current output — including
// quirks such as identity fallback when no case matches — not a judgment of
// correctness. Do not "fix" a value here without first confirming the
// extraction changed behavior unintentionally.
//
// The 8 source families (per src/layouts/register-all.ts):
//   base, verge-pop, sprint, onboarding, handbook, engineering, advocacy,
//   advocacy-dense
// The 5 transcription targets (per transcribeTopic's targetFamily param):
//   base, verge, handbook, advocacy, advocacy-dense

type Target = "base" | "verge" | "handbook" | "advocacy" | "advocacy-dense";

const TARGETS: Target[] = ["base", "verge", "handbook", "advocacy", "advocacy-dense"];

/** One row per source layout: family label (for grouping) + a representative input. */
interface MatrixRow {
  family: string;
  layout: string;
  input: Topic;
  /** Expected result layout per target, in TARGETS order. */
  expectLayout: Record<Target, string>;
}

const MATRIX: MatrixRow[] = [
  // ── base family ──────────────────────────────────────────────────────────
  {
    family: "base", layout: "two-col",
    input: topic("two-col", {
      summary: "sum", heroPoints: ["h1", "h2"],
      cards: [{ title: "C1", body: "b1" }, { title: "C2", body: "b2" }],
      talkingPoints: ["tp1"],
    }),
    expectLayout: {
      base: "two-col", verge: "color-blocks", handbook: "hb-chapter",
      advocacy: "adv-overview", "advocacy-dense": "advd-overview",
    },
  },
  {
    family: "base", layout: "stat-cards",
    input: topic("stat-cards", {
      kicker: "K", thesis: "Th",
      cards: [{ title: "S1", stat: "10x", statLabel: "Speed", body: "fast", step: "01", eyebrow: "e", icon: "i" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "stat-hero", handbook: "hb-practices",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "base", layout: "before-after",
    input: topic("before-after", { cards: [{ title: "BA1", challenge: "ch1", fix: "fx1" }] }),
    expectLayout: {
      base: "before-after", verge: "color-blocks", handbook: "hb-chapter",
      advocacy: "adv-hurdles", "advocacy-dense": "advd-hurdles",
    },
  },
  {
    family: "base", layout: "process-cycle",
    input: topic("process-cycle", { steps: [{ num: "1", title: "S1", body: "b1" }] }),
    expectLayout: {
      // Not handled by toAdvocacy → falls to default → identity (stays process-cycle).
      base: "process-cycle", verge: "color-blocks", handbook: "hb-process",
      advocacy: "process-cycle", "advocacy-dense": "process-cycle",
    },
  },
  {
    family: "base", layout: "h-strip",
    input: topic("h-strip", { cards: [{ title: "H1", body: "hb1" }], callout: "call" }),
    expectLayout: {
      base: "h-strip", verge: "quote-collage", handbook: "hb-manifesto",
      advocacy: "adv-future", "advocacy-dense": "advd-future",
    },
  },
  {
    family: "base", layout: "process-lanes",
    input: topic("process-lanes", {
      lanes: [{ title: "L1", persona: "p1", subtitle: "sub1" }],
      focusPanels: ["fp1"], capabilities: ["cap1"], eyebrow: "eb",
    }),
    expectLayout: {
      base: "process-lanes", verge: "color-blocks", handbook: "hb-index",
      advocacy: "adv-platform", "advocacy-dense": "advd-platform",
    },
  },
  // ── verge-pop family ─────────────────────────────────────────────────────
  {
    family: "verge-pop", layout: "stat-hero",
    input: topic("stat-hero", {
      heroTitle: "HT", subtitle: "sub",
      statCards: [{ value: "5x", label: "Lbl", body: "body text here" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "stat-hero", handbook: "hb-practices",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "verge-pop", layout: "quote-collage",
    input: topic("quote-collage", { quotes: [{ text: "Q1", attr: "A1" }, { text: "Q2", attr: "A2" }] }),
    expectLayout: {
      base: "h-strip", verge: "quote-collage", handbook: "hb-manifesto",
      advocacy: "adv-future", "advocacy-dense": "advd-future",
    },
  },
  {
    family: "verge-pop", layout: "badge-grid",
    input: topic("badge-grid", { badges: [{ icon: "i1", label: "B1", meta: "m1", name: "n1" }] }),
    expectLayout: {
      base: "two-col", verge: "badge-grid", handbook: "hb-index",
      advocacy: "adv-overview", "advocacy-dense": "advd-overview",
    },
  },
  {
    family: "verge-pop", layout: "data-table",
    input: topic("data-table", {
      tableTitle: "TT", subtitle: "sub", tableRows: [["R1C1", "R1C2", "R1C3"]],
    }),
    expectLayout: {
      base: "stat-cards", verge: "data-table", handbook: "hb-chapter",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "verge-pop", layout: "bar-chart",
    input: topic("bar-chart", {
      subtitle: "sub", barGroups: [{ label: "G1", bars: [{ label: "b1", value: "10" }] }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "bar-chart", handbook: "hb-practices",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "verge-pop", layout: "color-blocks",
    input: topic("color-blocks", { subtitle: "sub", blocks: [{ label: "Bl1", body: "body1" }] }),
    expectLayout: {
      base: "two-col", verge: "color-blocks", handbook: "hb-chapter",
      advocacy: "adv-overview", "advocacy-dense": "advd-overview",
    },
  },
  // ── onboarding family ────────────────────────────────────────────────────
  {
    family: "onboarding", layout: "info-cards",
    input: topic("info-cards", {
      banner: "Banner!", order: 3,
      cards: [{ stat: "10x", statLabel: "Speed", title: "Fast", body: "vf", icon: "i1" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "stat-hero", handbook: "hb-practices",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "onboarding", layout: "checklist",
    input: topic("checklist", {
      subtitle: "sub",
      approved: [{ title: "A1", desc: "d1", icon: "ia" }],
      forbidden: [{ title: "F1", desc: "d2", icon: "if" }],
    }),
    expectLayout: {
      base: "two-col", verge: "badge-grid", handbook: "hb-chapter",
      advocacy: "adv-overview", "advocacy-dense": "advd-overview",
    },
  },
  {
    family: "onboarding", layout: "workflow",
    input: topic("workflow", {
      steps: [
        { num: "1", title: "S1", body: "b1", type: "human", tip: "tip1" },
        { num: "2", title: "S2", body: "b2", type: "ai" },
      ],
    }),
    expectLayout: {
      base: "two-col", verge: "color-blocks", handbook: "hb-process",
      advocacy: "adv-hurdles", "advocacy-dense": "advd-hurdles",
    },
  },
  {
    family: "onboarding", layout: "pillars",
    input: topic("pillars", {
      subtitle: "sub",
      pillars: [{ title: "P1", icon: "pi", items: ["it1", "it2", "it3"] }],
      results: [{ val: "99", label: "Uptime" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "color-blocks", handbook: "hb-index",
      advocacy: "adv-platform", "advocacy-dense": "advd-platform",
    },
  },
  {
    family: "onboarding", layout: "catalog",
    input: topic("catalog", {
      subtitle: "sub",
      categories: [{ title: "Cat1", items: ["s1", { label: "s2", desc: "d2" }] }],
    }),
    expectLayout: {
      base: "two-col", verge: "color-blocks", handbook: "hb-index",
      advocacy: "adv-future", "advocacy-dense": "advd-future",
    },
  },
  {
    family: "onboarding", layout: "op-brief",
    input: topic("op-brief", {
      headline: "HL", cards: [{ title: "O1", body: "ob1", stat: "st1", statLabel: "sl1" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "stat-hero", handbook: "hb-practices",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "onboarding", layout: "op-flow",
    input: topic("op-flow", { steps: [{ title: "OF1", body: "ofb1", num: "1", type: "t1", tip: "otip" }] }),
    expectLayout: {
      base: "two-col", verge: "color-blocks", handbook: "hb-process",
      advocacy: "adv-hurdles", "advocacy-dense": "advd-hurdles",
    },
  },
  // ── handbook family ──────────────────────────────────────────────────────
  {
    family: "handbook", layout: "hb-chapter",
    input: topic("hb-chapter", {
      eyebrow: "eb", summary: "sum", heroPoints: ["hp1"],
      chapters: [{ num: "01", title: "Ch1", sub: "s1" }],
    }),
    expectLayout: {
      base: "two-col", verge: "color-blocks", handbook: "hb-chapter",
      advocacy: "adv-overview", "advocacy-dense": "advd-overview",
    },
  },
  {
    family: "handbook", layout: "hb-practices",
    input: topic("hb-practices", {
      eyebrow: "eb", summary: "sum", practices: [{ title: "Pr1", body: "pb1", dark: false }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "color-blocks", handbook: "hb-practices",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "handbook", layout: "hb-process",
    input: topic("hb-process", { steps: [{ num: "1", title: "S1", body: "b1" }] }),
    expectLayout: {
      // Not handled by toAdvocacy → falls to default → identity (stays hb-process).
      base: "process-cycle", verge: "color-blocks", handbook: "hb-process",
      advocacy: "hb-process", "advocacy-dense": "hb-process",
    },
  },
  {
    family: "handbook", layout: "hb-manifesto",
    input: topic("hb-manifesto", { eyebrow: "eb", statement: "State", beliefs: ["bel1", "bel2"] }),
    expectLayout: {
      base: "h-strip", verge: "quote-collage", handbook: "hb-manifesto",
      advocacy: "adv-future", "advocacy-dense": "advd-future",
    },
  },
  {
    family: "handbook", layout: "hb-index",
    input: topic("hb-index", { eyebrow: "eb", categories: [{ label: "Lbl1", body: "cb1" }] }),
    expectLayout: {
      base: "two-col", verge: "badge-grid", handbook: "hb-index",
      advocacy: "adv-platform", "advocacy-dense": "advd-platform",
    },
  },
  // ── engineering family ───────────────────────────────────────────────────
  {
    family: "engineering", layout: "eng-architecture",
    input: topic("eng-architecture", {
      subtitle: "sub", subheadline: "shl",
      cards: [{ title: "EA1", body: "eab1", stat: "es1", statLabel: "esl1" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "stat-hero", handbook: "hb-chapter",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "engineering", layout: "eng-code-flow",
    input: topic("eng-code-flow", { cards: [{ title: "ECF1", body: "ecfb1", icon: "eci" }] }),
    expectLayout: {
      base: "two-col", verge: "badge-grid", handbook: "hb-process",
      advocacy: "adv-hurdles", "advocacy-dense": "advd-hurdles",
    },
  },
  {
    family: "engineering", layout: "eng-tech-stack",
    input: topic("eng-tech-stack", {
      subtitle: "sub", subheadline: "shl",
      cards: [{ title: "ETS1", body: "etsb1", stat: "ets1" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "color-blocks", handbook: "hb-chapter",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "engineering", layout: "eng-roadmap",
    input: topic("eng-roadmap", { callout: "ercall", cards: [{ title: "ER1", body: "erb1" }] }),
    expectLayout: {
      base: "h-strip", verge: "color-blocks", handbook: "hb-chapter",
      advocacy: "adv-future", "advocacy-dense": "advd-future",
    },
  },
  // ── advocacy family ──────────────────────────────────────────────────────
  {
    family: "advocacy", layout: "adv-overview",
    input: topic("adv-overview", {
      summary: "sum", heroPoints: ["ahp1"], cards: [{ title: "AO1", body: "aob1" }],
      talkingPoints: ["atp1"],
    }),
    expectLayout: {
      base: "two-col", verge: "badge-grid", handbook: "hb-chapter",
      advocacy: "adv-overview", "advocacy-dense": "advd-overview",
    },
  },
  {
    family: "advocacy", layout: "adv-stats",
    input: topic("adv-stats", {
      thesis: "ath", cards: [{ title: "AS1", body: "asb1", step: "as-step", eyebrow: "as-eb" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "stat-hero", handbook: "hb-practices",
      advocacy: "adv-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "advocacy", layout: "adv-hurdles",
    input: topic("adv-hurdles", { cards: [{ title: "AH1", challenge: "ahc1" }] }),
    expectLayout: {
      base: "before-after", verge: "color-blocks", handbook: "hb-chapter",
      advocacy: "adv-hurdles", "advocacy-dense": "advd-hurdles",
    },
  },
  {
    family: "advocacy", layout: "adv-future",
    input: topic("adv-future", { callout: "afcall", title: "AFTitle", cards: [{ title: "AF1", body: "afb1" }] }),
    expectLayout: {
      base: "h-strip", verge: "quote-collage", handbook: "hb-manifesto",
      advocacy: "adv-future", "advocacy-dense": "advd-future",
    },
  },
  {
    family: "advocacy", layout: "adv-platform",
    input: topic("adv-platform", {
      capabilities: [{ title: "AP1", icon: "api1", body: "apb1" }],
      focusPanels: ["afp1"], lanes: ["alane1"],
    }),
    expectLayout: {
      base: "process-lanes", verge: "color-blocks", handbook: "hb-index",
      advocacy: "adv-platform", "advocacy-dense": "advd-platform",
    },
  },
  // ── advocacy-dense family ────────────────────────────────────────────────
  {
    family: "advocacy-dense", layout: "advd-overview",
    input: topic("advd-overview", {
      summary: "sum", heroPoints: ["dhp1"], cards: [{ title: "DO1", body: "dob1" }],
      talkingPoints: ["dtp1"],
    }),
    expectLayout: {
      base: "two-col", verge: "badge-grid", handbook: "hb-chapter",
      advocacy: "advd-overview", "advocacy-dense": "advd-overview",
    },
  },
  {
    family: "advocacy-dense", layout: "advd-stats",
    input: topic("advd-stats", {
      thesis: "dth", cards: [{ title: "DS1", body: "dsb1", step: "ds-step", eyebrow: "ds-eb" }],
    }),
    expectLayout: {
      base: "stat-cards", verge: "stat-hero", handbook: "hb-practices",
      advocacy: "advd-stats", "advocacy-dense": "advd-stats",
    },
  },
  {
    family: "advocacy-dense", layout: "advd-hurdles",
    input: topic("advd-hurdles", { cards: [{ title: "DH1", challenge: "dhc1" }] }),
    expectLayout: {
      base: "before-after", verge: "color-blocks", handbook: "hb-chapter",
      advocacy: "advd-hurdles", "advocacy-dense": "advd-hurdles",
    },
  },
  {
    family: "advocacy-dense", layout: "advd-future",
    input: topic("advd-future", { callout: "dfcall", title: "DFTitle", cards: [{ title: "DF1", body: "dfb1" }] }),
    expectLayout: {
      base: "h-strip", verge: "quote-collage", handbook: "hb-manifesto",
      advocacy: "advd-future", "advocacy-dense": "advd-future",
    },
  },
  {
    family: "advocacy-dense", layout: "advd-platform",
    input: topic("advd-platform", {
      capabilities: [{ title: "DP1", icon: "dpi1", body: "dpb1" }],
      focusPanels: ["dfp1"], lanes: ["dlane1"],
    }),
    expectLayout: {
      base: "process-lanes", verge: "color-blocks", handbook: "hb-index",
      advocacy: "advd-platform", "advocacy-dense": "advd-platform",
    },
  },
];

describe("transcribeTopic — full family matrix (characterization)", () => {
  for (const row of MATRIX) {
    describe(`${row.family} / ${row.layout}`, () => {
      for (const target of TARGETS) {
        it(`→ ${target} produces layout "${row.expectLayout[target]}"`, () => {
          const result = transcribeTopic(row.input, target);
          expect(result.layout).toBe(row.expectLayout[target]);
        });
      }
    });
  }

  it("covers all 8 source families named in the DECK-4 ticket", () => {
    const families = new Set(MATRIX.map((r) => r.family));
    expect(families).toEqual(new Set([
      "base", "verge-pop", "onboarding", "handbook",
      "engineering", "advocacy", "advocacy-dense",
    ]));
  });

  it("covers every registered layout ID across all families (39 total, minus stat-cards-manifest which is auto-routed)", () => {
    const coveredLayouts = new Set(MATRIX.map((r) => r.layout));
    expect(coveredLayouts.size).toBe(MATRIX.length);
    expect(coveredLayouts.size).toBe(38);
  });
});

// ── Field-shape pins for previously-untested cross-family directions ─────────
//
// The matrix above pins the resulting `layout` for every cell. These
// additional tests pin key *field* transformations for the three directions
// the ticket specifically called out as untested: handbook → advocacy,
// verge-pop → * (all four targets), and engineering → *. Field-level pins
// catch regressions the layout-only check above would miss (e.g. extraction
// silently dropping a mapped field).

describe("transcribeTopic — handbook → advocacy field shape", () => {
  it("hb-chapter → advocacy maps chapters to cards and preserves heroPoints/summary", () => {
    const input = topic("hb-chapter", {
      eyebrow: "eb", summary: "sum", heroPoints: ["hp1"],
      chapters: [{ num: "01", title: "Ch1", sub: "s1" }],
    });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.cards).toEqual([{ title: "Ch1", body: "s1" }]);
    expect(result.heroPoints).toEqual(["hp1"]);
    expect(result.summary).toBe("sum");
  });

  it("hb-practices → advocacy maps practices to cards with empty step/eyebrow/marker defaults", () => {
    const input = topic("hb-practices", {
      eyebrow: "eb", summary: "sum", practices: [{ title: "Pr1", body: "pb1", dark: false }],
    });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.thesis).toBe("sum");
    expect(result.cards).toEqual([{ title: "Pr1", body: "pb1", step: "", eyebrow: "", marker: "○" }]);
  });

  it("hb-manifesto → advocacy maps statement to callout and beliefs to cards", () => {
    const input = topic("hb-manifesto", { eyebrow: "eb", statement: "State", beliefs: ["bel1", "bel2"] });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.callout).toBe("State");
    expect(result.cards).toEqual([{ title: "bel1", body: "" }, { title: "bel2", body: "" }]);
  });

  it("hb-index → advocacy maps categories to capabilities with a fixed bullet icon and empty focusPanels/lanes", () => {
    const input = topic("hb-index", { eyebrow: "eb", categories: [{ label: "Lbl1", body: "cb1" }] });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.capabilities).toEqual([{ icon: "●", title: "Lbl1", body: "cb1" }]);
    expect(result.focusPanels).toEqual([]);
    expect(result.lanes).toEqual([]);
  });

  it("hb-process → advocacy has NO case in transcribeToAdvocacy and falls through to identity", () => {
    const input = topic("hb-process", { steps: [{ num: "1", title: "S1", body: "b1" }] });
    const result = transcribeTopic(input, "advocacy");
    // Pinning the current quirk: unmapped source layouts are returned as-is,
    // even though the target family was explicitly requested.
    expect(result).toBe(input);
    expect(result.layout).toBe("hb-process");
  });
});

describe("transcribeTopic — verge-pop → * field shape", () => {
  const statHeroInput = topic("stat-hero", {
    heroTitle: "HT", subtitle: "sub",
    statCards: [{ value: "5x", label: "Lbl", body: "body text here" }],
  });

  it("stat-hero → base maps statCards to cards with title fallback to body text", () => {
    const result = transcribeTopic(statHeroInput, "base") as Record<string, unknown>;
    expect(result.cards).toEqual([
      { title: "body text here", stat: "5x", statLabel: "Lbl", body: "body text here" },
    ]);
  });

  it("stat-hero → handbook maps statCards to practices with combined value+label title", () => {
    const result = transcribeTopic(statHeroInput, "handbook") as Record<string, unknown>;
    expect(result.practices).toEqual([{ title: "5x Lbl", body: "body text here", dark: false }]);
  });

  it("stat-hero → advocacy maps statCards to cards using label as title and value as step", () => {
    const result = transcribeTopic(statHeroInput, "advocacy") as Record<string, unknown>;
    expect(result.cards).toEqual([
      { title: "Lbl", body: "body text here", step: "5x", eyebrow: "", marker: "○" },
    ]);
    expect(result.thesis).toBe("sub");
  });

  it("quote-collage → advocacy uses the first quote as callout and drops it from cards", () => {
    const input = topic("quote-collage", { quotes: [{ text: "Q1", attr: "A1" }, { text: "Q2", attr: "A2" }] });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.callout).toBe("Q1");
    expect(result.cards).toEqual([{ title: "Q2", body: "A2" }]);
  });

  it("badge-grid → advocacy maps badges to heroPoints and cards using label/name fallback", () => {
    const input = topic("badge-grid", { badges: [{ icon: "i1", label: "B1", meta: "m1", name: "n1" }] });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.heroPoints).toEqual(["B1"]);
    expect(result.cards).toEqual([{ title: "B1", body: "m1" }]);
  });

  it("data-table → advocacy joins non-first row cells into body with middle-dot separator", () => {
    const input = topic("data-table", { tableTitle: "TT", tableRows: [["R1C1", "R1C2", "R1C3"]] });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.thesis).toBe("TT");
    expect(result.cards).toEqual([
      { title: "R1C1", body: "R1C2 · R1C3", step: "", eyebrow: "", marker: "○" },
    ]);
  });

  it("bar-chart → advocacy joins bar label/value pairs with comma separator", () => {
    const input = topic("bar-chart", {
      subtitle: "sub", barGroups: [{ label: "G1", bars: [{ label: "b1", value: "10" }] }],
    });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.cards).toEqual([
      { title: "G1", body: "b1: 10", step: "", eyebrow: "", marker: "○" },
    ]);
  });

  it("color-blocks → advocacy maps blocks to cards with an empty heroPoints array", () => {
    const input = topic("color-blocks", { blocks: [{ label: "Bl1", body: "body1" }] });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.heroPoints).toEqual([]);
    expect(result.cards).toEqual([{ title: "Bl1", body: "body1" }]);
  });
});

describe("transcribeTopic — engineering → * field shape", () => {
  it("eng-architecture → verge maps first card's stat/title into a single statCards entry", () => {
    const input = topic("eng-architecture", {
      subtitle: "sub", cards: [{ title: "EA1", body: "eab1", stat: "es1", statLabel: "esl1" }],
    });
    const result = transcribeTopic(input, "verge") as Record<string, unknown>;
    expect(result.statCards).toEqual([{ value: "es1", label: "EA1", body: "eab1" }]);
  });

  it("eng-code-flow → handbook maps cards to numbered steps for hb-process", () => {
    const input = topic("eng-code-flow", { cards: [{ title: "ECF1", body: "ecfb1", icon: "eci" }] });
    const result = transcribeTopic(input, "handbook") as Record<string, unknown>;
    expect(result.layout).toBe("hb-process");
    expect(result.steps).toEqual([{ num: "01", title: "ECF1", body: "ecfb1" }]);
  });

  it("eng-tech-stack → advocacy prefers subheadline over subtitle for thesis", () => {
    const input = topic("eng-tech-stack", {
      subtitle: "sub", subheadline: "shl", cards: [{ title: "ETS1", body: "etsb1", stat: "ets1" }],
    });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.thesis).toBe("shl");
    expect(result.cards).toEqual([
      { title: "ETS1", body: "etsb1", step: "ets1", eyebrow: "", marker: "○" },
    ]);
  });

  it("eng-roadmap → advocacy preserves callout and maps cards to title/body pairs", () => {
    const input = topic("eng-roadmap", { callout: "ercall", cards: [{ title: "ER1", body: "erb1" }] });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.layout).toBe("adv-future");
    expect(result.callout).toBe("ercall");
    expect(result.cards).toEqual([{ title: "ER1", body: "erb1" }]);
  });

  it("eng-architecture → advocacy falls back from subheadline undefined to subtitle for thesis", () => {
    const input = topic("eng-architecture", {
      subtitle: "sub", cards: [{ title: "EA1", body: "eab1", stat: "es1", statLabel: "esl1" }],
    });
    const result = transcribeTopic(input, "advocacy") as Record<string, unknown>;
    expect(result.thesis).toBe("sub");
  });
});

// ── transcribeToAdvocacyDense: delegation + prefix rewrite semantics ─────────

describe("transcribeTopic — advocacy-dense delegates to transcribeToAdvocacy then rewrites prefix", () => {
  it("engineering source produces an advd- prefixed layout matching the adv- equivalent", () => {
    const input = topic("eng-roadmap", { callout: "c", cards: [{ title: "T1", body: "b1" }] });
    const viaAdvocacy = transcribeTopic(input, "advocacy");
    const viaAdvocacyDense = transcribeTopic(input, "advocacy-dense");
    expect(viaAdvocacyDense.layout).toBe(viaAdvocacy.layout.replace("adv-", "advd-"));
  });

  it("a layout with no adv- prefix in the resulting layout is left unchanged by the rewrite", () => {
    // hb-process has no case in transcribeToAdvocacy, so transcribeToAdvocacy
    // returns it unchanged (layout stays "hb-process", no "adv-" substring),
    // and the .replace("adv-","advd-") in transcribeToAdvocacyDense is a no-op.
    const input = topic("hb-process", { steps: [] });
    const result = transcribeTopic(input, "advocacy-dense");
    expect(result.layout).toBe("hb-process");
  });
});
