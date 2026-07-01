import { defineConfig } from "vitest/config";

// ── Coverage thresholds ──────────────────────────────────────────────────
//
// Regression floor set at the MEASURED level (2026-07-01, @vitest/coverage-v8
// installed and pinned to the vitest version). These ratchet coverage: CI
// fails if it drops below them. Measured baseline —
//   lines 43.01 / statements 44.42 / functions 33.33 / branches 19.87.
// They are intentionally low because the include scope below still counts
// transcription.ts (the 683-line monolith slated for extraction + tests in
// DECK-4) and the src/tokens/* design-token data files, alongside the
// well-covered core (content/merge/schema ~97%, LayoutRenderer ~96%). Raise
// these as DECK-4 lands transcription coverage.
//
// Context for the estimate: ~40 presentational layout .tsx components,
// one per family subdirectory under src/layouts/ (advocacy, base, sprint,
// etc.), are verified via Storybook, not Vitest, per this project's
// CLAUDE.md convention — so a whole-repo coverage run will show a large
// body of intentionally-Vitest-uncovered files. `include`/`exclude` below
// scope coverage to the files Vitest unit tests actually target: the
// content/merge/schema logic, tokens, transcription, and the *registry*
// plumbing living directly under src/layouts/ (registry.ts,
// LayoutRenderer.tsx, register-all.ts — all covered by registry.test.ts /
// layout-render.test.tsx) — while excluding the family subdirectories
// themselves. branches is set lowest because conditional/optional-prop
// branches are the hardest metric to hit and most likely to still be
// inflated even with that scoping.
const COVERAGE_FLOOR = {
  lines: 42,
  statements: 43,
  functions: 32,
  branches: 18,
};

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Scoped to the directories Vitest unit tests actually exercise
      // (content/merge/schema logic, tokens, transcription, layout
      // registry plumbing) — not the 8 src/layouts/<family>/ component
      // directories (Storybook-covered) or entry/bootstrap files.
      include: [
        "src/content/**/*.{ts,tsx}",
        "src/patterns/**/*.{ts,tsx}",
        "src/tokens/**/*.{ts,tsx}",
        "src/layouts/*.{ts,tsx}",
        "src/transcription.ts",
        "src/decks.ts",
      ],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/*.stories.{jsx,tsx}",
      ],
      thresholds: {
        lines: COVERAGE_FLOOR.lines,
        statements: COVERAGE_FLOOR.statements,
        functions: COVERAGE_FLOOR.functions,
        branches: COVERAGE_FLOOR.branches,
      },
    },
  },
});
