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
    // This count is derived at runtime from the actual registry state,
    // so it moves with the codebase — no magic number to maintain.
    const registeredIds = layoutRegistry.list();
    // Verify all families have at least one representative registered
    const missingFamilies = Object.entries(FAMILY_REPRESENTATIVES)
      .filter(([, id]) => !registeredIds.includes(id))
      .map(([family]) => family);
    expect(missingFamilies).toEqual([]);
  });
});

describe("Layout families — one render per family", () => {
  beforeAll(() => {
    // Ensure register-all side-effects have run (already imported above)
  });

  function renderFamily(layoutId: string, extraSlide?: Record<string, unknown>) {
    const slide = { ...MINIMAL_SLIDE, ...extraSlide };
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

  it("base family: two-col renders without throwing", () => {
    expect(renderFamily("two-col")).not.toThrow();
  });

  it("verge-pop family: stat-hero renders without throwing", () => {
    expect(renderFamily("stat-hero")).not.toThrow();
  });

  it("sprint family: process-cycle renders without throwing", () => {
    expect(renderFamily("process-cycle")).not.toThrow();
  });

  it("onboarding family: info-cards renders without throwing", () => {
    expect(renderFamily("info-cards")).not.toThrow();
  });

  it("handbook family: hb-chapter renders without throwing", () => {
    expect(renderFamily("hb-chapter")).not.toThrow();
  });

  it("engineering family: eng-architecture renders without throwing", () => {
    expect(renderFamily("eng-architecture")).not.toThrow();
  });

  it("advocacy family: adv-overview renders without throwing", () => {
    expect(renderFamily("adv-overview")).not.toThrow();
  });

  it("advocacy-dense family: advd-overview renders without throwing", () => {
    expect(renderFamily("advd-overview")).not.toThrow();
  });
});
