import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "single-file",
      "storybook-static",
      "node_modules",
      "scripts",
      "**/*.config.js",
      "**/*.config.ts",
      ".storybook",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // ── Hard gates (error) ───────────────────────────────────────────────
      // The codebase is clean for each of these, so any regression fails CI.
      "@typescript-eslint/no-explicit-any": "error",        // keeps the "strict mode" headline honest
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-expressions": "error",  // catches accidental no-op statements
      "react-hooks/exhaustive-deps": "error",               // effect dependency correctness
      "react-hooks/refs": "error",                          // no ref reads/writes during render
      "react-hooks/error-boundaries": "error",              // no try/catch-as-error-boundary in render
      "react-hooks/static-components": "error",             // no components created during render
      "react-hooks/purity": "error",                        // render must be side-effect free
      "react-hooks/immutability": "error",                  // never mutate props/state (matches our coding standards)
      // ── Advisory (warn) by design ────────────────────────────────────────
      // set-state-in-effect stays a warning: this animation-heavy app has a few
      // legitimate "reset animation state when a dependency changes" effects
      // (intro re-queue in App.v14, comet phase reset in CometTransition) that
      // the rule flags but that are correct as written. Promoting would force
      // event-handler/key refactors of working transition code for marginal gain.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // ── Storybook stories (.jsx) ───────────────────────────────────────────────
  // Stories stay plain JSX (the rest of src is .tsx). Lint them as ES modules
  // with JSX + browser globals so they share the same baseline hygiene checks
  // (unused vars, no-undef) as the rest of the source tree.
  {
    files: ["src/**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // typescript-eslint's no-unused-vars also matches .jsx (its config has no
      // `files` restriction); keep that single source of truth and silence the
      // core rule so unused vars aren't double-reported.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Storybook `render: () => {...}` thunks legitimately call hooks (useState
      // for interactive controls) even though they aren't capitalised React
      // components. rules-of-hooks can't recognise the story idiom, so disable it
      // for stories only — the same hooks are exercised by the real components.
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
);
