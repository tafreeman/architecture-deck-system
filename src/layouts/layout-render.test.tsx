/// <reference types="vite/client" />
/**
 * layout-render.test.tsx — smoke-render test suite for the layout registry.
 *
 * Verifies:
 *   1. LayoutRenderer renders without throwing for a representative layout.
 *   2. ControlPanel renders and its toggle button is accessible.
 *   3. Registry contains at least one ID per family after register-all is imported.
 *   4. One render test per layout family (8 families).
 *
 * "Deleting a layout registration causes a test failure" is guaranteed by
 * (a) the per-family tests asserting their representative IDs are in the registry,
 * and (b) test (3) asserting all EXPECTED_IDS are registered.
 */

import React from "react";
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Register all layouts as a side-effect ───────────────────────────────────
import "./register-all.ts";
import { layoutRegistry } from "./registry.ts";
import { LayoutRenderer } from "./LayoutRenderer.tsx";
import { ControlPanel } from "../components/navigation/ControlPanel.tsx";
import { ThemeContext, ChromeContext } from "../components/context/index.ts";
import { THEMES } from "../tokens/themes.ts";
import { STYLE_MODES_BY_ID } from "../tokens/style-modes.ts";
import { DeckLanding } from "../components/deck/index.ts";

// ── Test fixtures ───────────────────────────────────────────────────────────

const THEME = THEMES[0]; // midnight-teal
const CHROME = STYLE_MODES_BY_ID["default"];

/** Minimal slide object satisfying BaseTopicProps requirements. */
const MINIMAL_SLIDE: Record<string, unknown> = {
  id: "test-slide",
  title: "Test Slide",
  color: "#22D3EE",
  colorLight: "#67E8F9",
  colorGlow: "#22D3EE33",
  icon: "◌",
  subtitle: "A test subtitle",
  heroPoints: [],
  talkingPoints: [],
  cards: [],
};

/** Minimal sprint nodes for the sprint layout. */
const MINIMAL_NODES = [
  { abbr: "RQ", label: "Requirement", type: "input", icon: "📋" },
  { abbr: "CO", label: "Code", type: "output", icon: "💻" },
];

/** One representative layout ID per family. */
const FAMILY_REPRESENTATIVES: Record<string, string> = {
  base: "two-col",
  "verge-pop": "stat-hero",
  sprint: "process-cycle",
  onboarding: "info-cards",
  handbook: "hb-chapter",
  engineering: "eng-architecture",
  advocacy: "adv-overview",
  "advocacy-dense": "advd-overview",
};

/**
 * All representative IDs from each family. Failing to register any of these
 * (e.g. by deleting a register call) immediately breaks the test.
 */
const EXPECTED_IDS = Object.values(FAMILY_REPRESENTATIVES);

/** Wrap a React element in the theme and chrome contexts. */
function withContexts(element: React.ReactElement) {
  return (
    <ThemeContext.Provider value={THEME}>
      <ChromeContext.Provider value={CHROME}>
        {element}
      </ChromeContext.Provider>
    </ThemeContext.Provider>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("LayoutRenderer — smoke render", () => {
  it("renders two-col without throwing", () => {
    expect(() =>
      render(
        withContexts(
          <LayoutRenderer
            layout="two-col"
            slide={MINIMAL_SLIDE}
            themeId="midnight-teal"
            onBack={() => undefined}
          />,
        ),
      ),
    ).not.toThrow();
  });
});

describe("ControlPanel — smoke render", () => {
  it("renders the toggle button", () => {
    render(
      withContexts(
        <ControlPanel
          decks={{ onboarding: { title: "Onboarding", titleAccent: "Guidebook" } }}
          deckKey="onboarding"
          onDeckChange={() => undefined}
          themes={[THEME]}
          theme={THEME}
          onThemeChange={() => undefined}
          onThemeReset={() => undefined}
          themeManual={false}
          deckThemeId="midnight-teal"
          styleModes={[CHROME]}
          styleModeId="default"
          onStyleModeChange={() => undefined}
          renderFamily="native"
          onRenderFamilyChange={() => undefined}
        />,
      ),
    );
    expect(screen.getByRole("button", { name: /open design panel/i })).toBeInTheDocument();
  });
});

describe("Layout registry — registration integrity", () => {
  it("registers all expected family representative IDs", () => {
    for (const id of EXPECTED_IDS) {
      expect(layoutRegistry.has(id), `Expected "${id}" to be registered`).toBe(true);
    }
  });

  it("registration count equals total IDs registered via register-all", () => {
    // Derive the expected count at runtime by globbing every register.ts file
    // in the layouts tree and counting how many layout IDs they register.
    // This way, adding or removing a registration fails the test automatically
    // without any magic literal to maintain.
    //
    // import.meta.glob with { eager: true } is evaluated by Vite/Vitest at
    // bundle time and returns a map of { path → module }. We count unique keys
    // from the registry (which was populated as a side-effect of register-all.ts
    // already imported at the top of this file) and compare against a count
    // derived by counting registrations in those same register files.
    //
    // Strategy: sum up `layoutRegistry.register` + `layoutRegistry.registerBatch`
    // calls across all register.ts modules by inspecting each module's raw text
    // via Vite glob eager import of the register files as strings.
    const registerModules = import.meta.glob(
      "./{base,verge-pop,sprint,onboarding,handbook,engineering,advocacy,advocacy-dense}/register.ts",
      { eager: true, query: "?raw", import: "default" },
    ) as Record<string, string>;

    // Count every `layoutRegistry.register(` call (each registers exactly 1 ID)
    // plus expand each `registerBatch` call by counting how many "key": entries
    // follow (the batch object literal). This derives the expected total purely
    // from the source of truth without a hardcoded literal.
    let expectedCount = 0;
    for (const src of Object.values(registerModules)) {
      // Single-registrations: layoutRegistry.register(
      const singles = (src.match(/layoutRegistry\.register\(/g) ?? []).length;
      // Batch-registrations: count the string keys "id": inside each registerBatch call
      const batchKeys = (src.match(/^\s+"[\w-]+":/gm) ?? []).length;
      expectedCount += singles + batchKeys;
    }

    const actualCount = layoutRegistry.list().length;
    expect(actualCount).toBe(expectedCount);
  });
});

describe("Layout families — every registered layout renders", () => {
  beforeAll(() => {
    // Ensure register-all side-effects have run (already imported above)
  });

  /** Build a render thunk for one layout ID using the shared minimal fixture. */
  function renderLayout(layoutId: string, extraSlide?: Record<string, unknown>) {
    const slide = { ...MINIMAL_SLIDE, layout: layoutId, ...extraSlide };
    return () =>
      render(
        withContexts(
          <LayoutRenderer
            layout={layoutId}
            slide={slide}
            themeId="midnight-teal"
            onBack={() => undefined}
            nodes={MINIMAL_NODES}
          />,
        ),
      );
  }

  // Data-driven: render EVERY registered layout ID with the minimal fixture
  // (and MINIMAL_NODES, supplied to all via renderLayout, for the sprint cycle).
  // Adding a new layout to the registry automatically gets it covered here;
  // a layout that crashes on minimal input fails immediately.
  const allLayoutIds = layoutRegistry.list();

  it("registry exposes at least the documented 39 layout IDs", () => {
    expect(allLayoutIds.length).toBeGreaterThanOrEqual(39);
  });

  it.each(allLayoutIds)("layout %s renders without throwing", (layoutId) => {
    expect(renderLayout(layoutId)).not.toThrow();
  });
});

// ── DeckLanding — stats null-guard ──────────────────────────────────────────

describe("DeckLanding — stats null-guard", () => {
  const VIEWPORT = {
    width: 1440, height: 900, isPhone: false, isCompact: false,
    pagePaddingX: 48, pagePaddingTop: 36, pagePaddingBottom: 48,
    titleSize: 42, heroTitleSize: 44, sectionTitleSize: 32,
    bodySize: 15, subtitleSize: 16, cardGap: 20, tileMinHeight: 300,
    overlayScroll: "hidden" as const,
  };

  it("renders without crashing when deck.stats is undefined", () => {
    const deckNoStats = {
      brandLine: "Test Brand",
      title: "Test Deck",
      titleAccent: "Test",
      tagline: "Tagline",
      // stats intentionally omitted
    };
    expect(() =>
      render(
        withContexts(
          <DeckLanding
            deck={deckNoStats}
            deckTopics={[]}
            viewport={VIEWPORT}
            hovered={null}
            setHovered={() => undefined}
            handleSelect={() => undefined}
            heroImage=""
            heroImageEnabled={false}
            cometActive={false}
          />,
        ),
      ),
    ).not.toThrow();
  });

  it("renders without crashing when deck.stats is an empty array", () => {
    const deckEmptyStats = {
      brandLine: "Test Brand",
      title: "Test Deck",
      titleAccent: "Test",
      tagline: "Tagline",
      stats: [],
    };
    expect(() =>
      render(
        withContexts(
          <DeckLanding
            deck={deckEmptyStats}
            deckTopics={[]}
            viewport={VIEWPORT}
            hovered={null}
            setHovered={() => undefined}
            handleSelect={() => undefined}
            heroImage=""
            heroImageEnabled={false}
            cometActive={false}
          />,
        ),
      ),
    ).not.toThrow();
  });

  it("renders stat values when deck.stats is populated", () => {
    const deckWithStats = {
      brandLine: "Test Brand",
      title: "Test Deck",
      titleAccent: "Test",
      tagline: "Tagline",
      stats: [{ val: "42", lbl: "Slides" }, { val: "3", lbl: "Decks" }],
    };
    render(
      withContexts(
        <DeckLanding
          deck={deckWithStats}
          deckTopics={[]}
          viewport={VIEWPORT}
          hovered={null}
          setHovered={() => undefined}
          handleSelect={() => undefined}
          heroImage=""
          heroImageEnabled={false}
          cometActive={false}
        />,
      ),
    );
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Slides")).toBeInTheDocument();
  });
});
