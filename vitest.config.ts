import { defineConfig } from "vitest/config";

// ── Coverage thresholds ──────────────────────────────────────────────────
//
// Regression floor set at the MEASURED level (2026-07-01, @vitest/coverage-v8
// installed and pinned to the vitest version). These ratchet coverage: CI
// fails if it drops below them. Measured baseline —
//   lines 91.92 / statements 92.29 / functions 94.83 / branches 67.20.
//
// DECK-4 (same day) added a full 8-family x 5-target characterization
// matrix to transcription.test.ts and then split the former 683-line
// transcription.ts monolith into src/transcription/*.ts (one file per
// target family, each <200 lines, thin transcription.ts re-export shell
// preserving the public API). transcription.ts coverage went from ~14% to
// ~99.6% lines with zero behavior change — every characterization test
// still passes unmodified against the extracted code. That raised the
// whole-scope floor from the prior 43.01/44.42/33.33/19.87 baseline to the
// values above. branches remains the lowest metric — conditional/
// optional-prop branches (e.g. `c.title || ""` fallbacks) are the hardest
// to fully exercise and are not the focus of the characterization suite,
// which pins representative inputs rather than every optional-field path.
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
// themselves.
const COVERAGE_FLOOR = {
  lines: 91,
  statements: 92,
  functions: 94,
  branches: 67,
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
        "src/transcription/**/*.ts",
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
