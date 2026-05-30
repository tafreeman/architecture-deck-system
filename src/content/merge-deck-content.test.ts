import { describe, it, expect } from "vitest";

import { mergeDeckContent, type DeckStructure, type SlideStructure } from "./merge-deck-content.ts";
import type { DeckContent } from "./content-types.ts";

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Minimal deck-level text block */
const baseDeckMeta: DeckContent["deck"] = {
  brandLine: "Acme Corp",
  title: "Test Deck",
  titleAccent: "Test",
  tagline: "Tagline here",
  introTitle: "Intro Title",
  introSubtitle: "Intro Subtitle",
  introStats: [
    { val: "10x", lbl: "Faster" },
    { val: "99%", lbl: "Uptime" },
  ],
  stats: [],
};

/** Helper to build a minimal DeckContent fixture. */
function makeContent(
  slides: Record<string, Record<string, unknown>>,
  deck?: Partial<DeckContent["deck"]>,
): DeckContent {
  return {
    deck: { ...baseDeckMeta, ...deck },
    slides: slides as unknown as DeckContent["slides"],
  };
}

/** Helper to build a minimal DeckStructure fixture. */
function makeStructure(
  contentSlides: SlideStructure[],
  shellSlides: SlideStructure[] = [],
  extra?: Partial<Omit<DeckStructure, "contentSlides" | "shellSlides">>,
): DeckStructure {
  return {
    themeId: "midnight-teal",
    sprintNodes: [],
    shellSlides,
    contentSlides,
    ...extra,
  };
}

// ── 1. Exact ID match ─────────────────────────────────────────────────────────

describe("mergeDeckContent — ID match", () => {
  it("uses content slide when structure ID matches content slide ID", () => {
    const structure = makeStructure([
      { id: "overview", order: 1, layout: "two-col" },
    ]);
    const content = makeContent({
      overview: { title: "Overview Title", subtitle: "sub", cards: [] },
    });

    const result = mergeDeckContent(structure, content);

    expect(result.matchStats.id).toBe(1);
    expect(result.matchStats.role).toBe(0);
    expect(result.matchStats.layout).toBe(0);
    expect(result.matchStats.positional).toBe(0);
    expect(result.matchStats.none).toBe(0);
  });

  it("increments matchStats.id for each exact ID hit", () => {
    const structure = makeStructure([
      { id: "slide-a", order: 1, layout: "two-col" },
      { id: "slide-b", order: 2, layout: "stat-cards" },
    ]);
    const content = makeContent({
      "slide-a": { title: "A", subtitle: "", cards: [] },
      "slide-b": { title: "B", subtitle: "", cards: [] },
    });

    const { matchStats } = mergeDeckContent(structure, content);
    expect(matchStats.id).toBe(2);
  });

  it("structure fields override content fields (skeleton spread last)", () => {
    const structure = makeStructure([
      { id: "s1", order: 5, layout: "two-col", color: "#ff0000" },
    ]);
    const content = makeContent({
      s1: { title: "Content Title", subtitle: "", layout: "h-strip", order: 99, cards: [] },
    });

    const { slides } = mergeDeckContent(structure, content);
    const slide = slides.find((s) => s.id === "s1");
    // structure's layout and order win over content's
    expect(slide?.layout).toBe("two-col");
    expect(slide?.order).toBe(5);
    expect(slide?.color).toBe("#ff0000");
  });

  it("matched slide has matchMethod: id", () => {
    const structure = makeStructure([{ id: "hero", order: 1, layout: "stat-cards" }]);
    const content = makeContent({ hero: { title: "H", subtitle: "", cards: [] } });

    const { contentSlides } = mergeDeckContent(structure, content);
    expect(contentSlides[0].matchMethod).toBe("id");
  });
});

// ── 2. Role match ─────────────────────────────────────────────────────────────

describe("mergeDeckContent — role match", () => {
  it("matches by role when IDs do not align", () => {
    const structure = makeStructure([
      { id: "slide-x", order: 1, layout: "two-col", role: "overview" },
    ]);
    // Content has a different key but the same role
    const content = makeContent({
      "different-id": {
        role: "overview",
        title: "Role-matched Title",
        subtitle: "",
        cards: [],
      },
    });

    const { matchStats, contentSlides } = mergeDeckContent(structure, content);
    expect(matchStats.role).toBe(1);
    expect(matchStats.id).toBe(0);
    expect(contentSlides[0].matchMethod).toBe("role");
  });

  it("carries content title through role match", () => {
    const structure = makeStructure([
      { id: "any-id", order: 1, layout: "two-col", role: "evidence" },
    ]);
    const content = makeContent({
      "evidence-slide": {
        role: "evidence",
        title: "Evidence Title",
        subtitle: "",
        cards: [],
      },
    });

    const { contentSlides } = mergeDeckContent(structure, content);
    expect((contentSlides[0] as Record<string, unknown>).title).toBe("Evidence Title");
  });
});

// ── 3. Layout-compat match ────────────────────────────────────────────────────

describe("mergeDeckContent — layout compatibility match", () => {
  it("matches by sourceLayout compat group when ID and role both miss", () => {
    const structure = makeStructure([
      // Structure uses stat-cards; content has a slide with sourceLayout info-cards (same compat group)
      { id: "no-match-id", order: 1, layout: "stat-cards" },
    ]);
    const content = makeContent({
      "content-info": {
        sourceLayout: "info-cards",
        title: "Info Cards Title",
        subtitle: "",
        cards: [],
      },
    });

    const { matchStats, contentSlides } = mergeDeckContent(structure, content);
    expect(matchStats.layout).toBe(1);
    expect(matchStats.id).toBe(0);
    expect(matchStats.role).toBe(0);
    expect(contentSlides[0].matchMethod).toBe("layout");
  });

  it("h-strip structure matches adv-future sourceLayout (same compat group)", () => {
    const structure = makeStructure([
      { id: "strip-slide", order: 1, layout: "h-strip" },
    ]);
    const content = makeContent({
      "future-slide": {
        sourceLayout: "adv-future",
        title: "Future Title",
        subtitle: "",
        cards: [],
      },
    });

    const { matchStats } = mergeDeckContent(structure, content);
    expect(matchStats.layout).toBe(1);
  });
});

// ── 4. Positional fallback ────────────────────────────────────────────────────

describe("mergeDeckContent — positional fallback", () => {
  it("uses positional match when nothing else fits and content has remaining unused slides", () => {
    const structure = makeStructure([
      { id: "struct-id-no-match", order: 1, layout: "two-col" },
    ]);
    // Content slide has no matching ID, role or compatible sourceLayout
    const content = makeContent({
      "totally-different": {
        title: "Positional Title",
        subtitle: "",
        cards: [],
        // no role, no sourceLayout
      },
    });

    const { matchStats, contentSlides } = mergeDeckContent(structure, content);
    expect(matchStats.positional).toBe(1);
    expect(contentSlides[0].matchMethod).toBe("positional");
  });

  it("positional match still applies structure fields over content fields", () => {
    const structure = makeStructure([
      { id: "struct-id", order: 10, layout: "before-after", color: "#aabbcc" },
    ]);
    const content = makeContent({
      "content-id": {
        title: "C Title",
        subtitle: "",
        cards: [],
        order: 1,
        layout: "two-col",
      },
    });

    const { contentSlides } = mergeDeckContent(structure, content);
    expect(contentSlides[0].layout).toBe("before-after");
    expect(contentSlides[0].order).toBe(10);
    expect(contentSlides[0].color).toBe("#aabbcc");
  });
});

// ── 5. Structure-only fallback (none) ─────────────────────────────────────────

describe("mergeDeckContent — structure-only fallback", () => {
  it("uses label as title when no content slide is available", () => {
    const structure = makeStructure([
      { id: "orphan", order: 1, layout: "two-col", label: "Orphan Label" },
    ]);
    const content = makeContent({}); // no content slides

    const { matchStats, contentSlides } = mergeDeckContent(structure, content);
    expect(matchStats.none).toBe(1);
    expect(contentSlides[0].matchMethod).toBe("none");
    expect(contentSlides[0].title).toBe("Orphan Label");
  });

  it("falls back to slide id as title when label is also absent", () => {
    const structure = makeStructure([
      { id: "no-label", order: 1, layout: "stat-cards" },
    ]);
    const content = makeContent({});

    const { contentSlides } = mergeDeckContent(structure, content);
    expect(contentSlides[0].title).toBe("no-label");
  });

  it("all structure-only slides have matchMethod: none", () => {
    const structure = makeStructure([
      { id: "s1", order: 1, layout: "two-col", label: "L1" },
      { id: "s2", order: 2, layout: "stat-cards", label: "L2" },
    ]);
    const content = makeContent({});

    const { matchStats, contentSlides } = mergeDeckContent(structure, content);
    expect(matchStats.none).toBe(2);
    contentSlides.forEach((s) => expect(s.matchMethod).toBe("none"));
  });
});

// ── Slide sorting by order ────────────────────────────────────────────────────

describe("mergeDeckContent — slide ordering", () => {
  it("slides are sorted by order ascending", () => {
    const structure = makeStructure([
      { id: "b", order: 3, layout: "two-col" },
      { id: "a", order: 1, layout: "stat-cards" },
      { id: "c", order: 2, layout: "h-strip" },
    ]);
    const content = makeContent({
      a: { title: "A", subtitle: "", cards: [] },
      b: { title: "B", subtitle: "", cards: [] },
      c: { title: "C", subtitle: "", cards: [] },
    });

    const { slides } = mergeDeckContent(structure, content);
    const orders = slides.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((x, y) => x - y));
  });

  it("contentSlides are also sorted by order ascending", () => {
    const structure = makeStructure([
      { id: "z", order: 10, layout: "two-col" },
      { id: "y", order: 5, layout: "stat-cards" },
    ]);
    const content = makeContent({
      y: { title: "Y", subtitle: "", cards: [] },
      z: { title: "Z", subtitle: "", cards: [] },
    });

    const { contentSlides } = mergeDeckContent(structure, content);
    const orders = contentSlides.map((s) => s.order);
    expect(orders).toEqual([...orders].sort((x, y) => x - y));
  });
});

// ── Shell slides are included in slides (not contentSlides) ───────────────────

describe("mergeDeckContent — shell slides", () => {
  it("shell slides appear in slides but not in contentSlides", () => {
    const shellSlide: SlideStructure = { id: "shell-cover", order: 0, layout: "cover" };
    const structure = makeStructure(
      [{ id: "main", order: 1, layout: "two-col" }],
      [shellSlide],
    );
    const content = makeContent({
      main: { title: "Main", subtitle: "", cards: [] },
    });

    const { slides, contentSlides } = mergeDeckContent(structure, content);
    const allIds = slides.map((s) => s.id);
    const contentIds = contentSlides.map((s) => s.id);
    expect(allIds).toContain("shell-cover");
    expect(contentIds).not.toContain("shell-cover");
  });

  it("result slides count equals contentSlides + shellSlides", () => {
    const structure = makeStructure(
      [{ id: "c1", order: 2, layout: "two-col" }, { id: "c2", order: 3, layout: "stat-cards" }],
      [{ id: "sh1", order: 0, layout: "cover" }, { id: "sh2", order: 1, layout: "intro" }],
    );
    const content = makeContent({
      c1: { title: "C1", subtitle: "", cards: [] },
      c2: { title: "C2", subtitle: "", cards: [] },
    });

    const { slides, contentSlides } = mergeDeckContent(structure, content);
    expect(slides.length).toBe(contentSlides.length + 2);
  });
});

// ── introStatColors mapped onto deckMeta ──────────────────────────────────────

describe("mergeDeckContent — introStatColors", () => {
  it("maps introStatColors onto deckMeta.introStats[i].color", () => {
    const introStatColors = ["#ff0000", "#00ff00"];
    const structure = makeStructure([], [], { introStatColors });
    const content = makeContent({});

    const { deckMeta } = mergeDeckContent(structure, content);
    // `color` is injected at runtime by mergeDeckContent; the declared
    // introStats type intentionally omits it, so read through a widened type.
    const stats = deckMeta.introStats as readonly Record<string, unknown>[];
    expect(stats[0].color).toBe("#ff0000");
    expect(stats[1].color).toBe("#00ff00");
  });

  it("does not mutate the content.deck object", () => {
    const introStatColors = ["#aabbcc"];
    const structure = makeStructure([], [], { introStatColors });
    const content = makeContent({});
    const originalStats = content.deck.introStats;

    mergeDeckContent(structure, content);
    // Original introStats items should not have a color property injected
    expect((originalStats[0] as Record<string, unknown>).color).toBeUndefined();
  });

  it("leaves deckMeta unmodified when structure has no introStatColors", () => {
    const structure = makeStructure([]);
    const content = makeContent({});

    const { deckMeta } = mergeDeckContent(structure, content);
    // Should be the same reference
    expect(deckMeta).toBe(content.deck);
  });
});

// ── Return shape invariants ───────────────────────────────────────────────────

describe("mergeDeckContent — return shape", () => {
  it("returns themeId from the structure", () => {
    const structure = makeStructure([]);
    const content = makeContent({});
    expect(mergeDeckContent(structure, content).themeId).toBe("midnight-teal");
  });

  it("returns sprintNodes from the structure", () => {
    const nodes = [{ abbr: "DA", label: "Discovery", type: "sprint" }] as const;
    const structure: DeckStructure = { ...makeStructure([]), sprintNodes: nodes };
    const content = makeContent({});
    expect(mergeDeckContent(structure, content).sprintNodes).toBe(nodes);
  });

  it("returns deckMeta with brandLine from content.deck", () => {
    const structure = makeStructure([]);
    const content = makeContent({}, { brandLine: "My Brand" });
    expect(mergeDeckContent(structure, content).deckMeta.brandLine).toBe("My Brand");
  });

  it("matchStats keys cover all MatchMethod values", () => {
    const structure = makeStructure([]);
    const content = makeContent({});
    const { matchStats } = mergeDeckContent(structure, content);
    expect(matchStats).toHaveProperty("id");
    expect(matchStats).toHaveProperty("role");
    expect(matchStats).toHaveProperty("layout");
    expect(matchStats).toHaveProperty("positional");
    expect(matchStats).toHaveProperty("none");
  });
});

// ── Fallback content parameter ────────────────────────────────────────────────

describe("mergeDeckContent — fallback content parameter", () => {
  it("uses fallback content when primary content has no matching slide", () => {
    const structure = makeStructure([{ id: "fb-slide", order: 1, layout: "two-col" }]);
    const primary = makeContent({}); // no slides
    const fallback = makeContent({
      "fb-slide": { title: "Fallback Title", subtitle: "", cards: [] },
    });

    const { matchStats, contentSlides } = mergeDeckContent(structure, primary, fallback);
    // The fallback provides an exact ID match → still counted as "id"
    expect(matchStats.id).toBe(1);
    expect((contentSlides[0] as Record<string, unknown>).title).toBe("Fallback Title");
  });
});
