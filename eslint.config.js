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
      "src/**/*.jsx",
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
      // Style/strictness rules kept as warnings so the gate fails only on real
      // problems while the codebase tightens incrementally.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-expressions": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // react-hooks v7 advisory rules (ported from the monolith): each is a
      // behavioural refactor (error boundaries, ref patterns). Surface as
      // warnings now; rules-of-hooks stays an error.
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
    },
  },
);
