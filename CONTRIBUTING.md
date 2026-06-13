# Contributing to Architecture Deck System

Architecture Deck System is a TypeScript presentation-tooling library; contributions should follow the existing code style, keep CI green, and add or update tests alongside any change.

---

## Development Provenance & Verification

This repository is built solo with AI-assisted tooling. Because there is no second human reviewer, correctness is gated by **automated evidence**, not peer sign-off:

- **CI gates (every push / PR):** npm audit, ESLint, `tsc` type-check, Vitest, the layout-registry verification script (`verify:layouts`), the Vite build, and the Storybook build. Merges block on a red pipeline.
- **Behavioral verification:** Vitest unit tests plus the layout-registry count check assert the registry and rendering contracts.
- **Provenance:** AI-assisted changes are verified against these gates before merge; the CI and evaluation output is the verification artifact of record.

Contributions are welcome via PR; CI must pass and changes should add or update tests.
