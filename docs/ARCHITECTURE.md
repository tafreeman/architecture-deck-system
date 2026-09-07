# Architecture Reference

> Relocated from `README.md` on 2026-09-07 (portfolio review feedback: lead the
> README with what the system produces, keep the layout/theme registry detail
> here). Nothing below was deleted, only moved — see `README.md` for the
> product-facing overview and a link back to this file.

## Architecture

### Layer Overview

| Layer | File(s) | Responsibility |
|-------|---------|----------------|
| **Shell** | `src/App.tsx` | Deck factory, state, context providers, ControlPanel (authored as "App.v14" during the strangler migration) |
| **Layout Registry** | `src/layouts/registry.ts` | O(1) Map-based plugin system; 39 IDs across 8 families |
| **Layout Renderer** | `src/layouts/LayoutRenderer.tsx` | Resolves layout string → component; handles `stat-cards-manifest` routing |
| **Transcription** | `src/transcription.ts` | Cross-family content normalisation (e.g. `adv-future` → `h-strip`) |
| **Content Registry** | `src/content/content-registry.ts` | Runtime content-pack swapping; `CONTENT_PACKS` + `DECK_STRUCTURES` maps |
| **Merge Utility** | `src/content/merge-deck-content.ts` | 5-step cascading match — merges structure skeleton with text content |
| **Tokens** | `src/tokens/themes.ts`, `style-modes.ts`, `palette.ts` | 16 themes × 4 style modes orthogonal matrix; per-slide color resolution |
| **Contexts** | `src/components/context/` | `ThemeContext`, `ChromeContext` consumed by all layout components |

### Data Flow

```
deck.js (legacy) OR structure.js + content.json
  → mergeDeckContent()          5-step cascade match
  → MergedDeck                  { slides, deckMeta, matchStats }
  → resolveTopicColors()        assigns color/colorLight/colorGlow per slide
  → transcribeTopic()           normalises content for target layout family
  → LayoutRenderer              resolves layout string → registered component
  → Layout Component            renders with Theme + StyleMode + viewport tokens
```

The legacy `deck.js` path is retained for strangler migration compatibility and local presets such as `onboarding-op`. Runtime content-pack swapping uses the migrated `structure.js` + `content.json` path registered in `src/content/content-registry.ts`.

### Layout Registry Pattern

Layouts self-register at startup via side-effect imports. `register-all.ts` is imported once in `App.tsx` and cascades to all 8 family registration files. Each `register.ts` calls `layoutRegistry.register(id, Component, features)`.

`LayoutRenderer` adds one routing rule: `stat-cards` slides with `results`, `leadershipPoints`, `enablement`, or `thesis` fields are routed to the `stat-cards-manifest` variant.

## Layout Families

| Family | IDs | Registered Layout IDs |
|--------|-----|-----------------------|
| base | 6 | `two-col`, `stat-cards`, `stat-cards-manifest`, `before-after`, `h-strip`, `process-lanes` |
| verge-pop | 6 | `stat-hero`, `quote-collage`, `badge-grid`, `data-table`, `bar-chart`, `color-blocks` |
| sprint | 1 | `process-cycle` |
| onboarding | 7 | `info-cards`, `checklist`, `workflow`, `pillars`, `catalog`, `op-brief`, `op-flow` |
| handbook | 5 | `hb-chapter`, `hb-practices`, `hb-process`, `hb-manifesto`, `hb-index` |
| engineering | 4 | `eng-architecture`, `eng-code-flow`, `eng-tech-stack`, `eng-roadmap` |
| advocacy | 5 | `adv-overview`, `adv-stats`, `adv-hurdles`, `adv-future`, `adv-platform` |
| advocacy-dense | 5 | `advd-overview`, `advd-stats`, `advd-hurdles`, `advd-future`, `advd-platform` |
| **Total** | **39** | |

## Themes and Style Modes

16 themes × 4 style modes form an orthogonal matrix — any combination is valid.

**Themes:** midnight-teal (default), obsidian-ember, arctic-steel, midnight-verdant, neon-noir, paper-ink, atelier-sage, signal-cobalt, verge-orange, verge-blue, verge-pink, verge-yellow, gamma-dark, studio-craft, linear, console

**Style Modes:** default (Modern Tech), brutalist (Swiss Systems), editorial (Magazine Pacing), pop (Bold Flat Zine)

Per-slide accent colors are derived from each theme's semantic palette (`accent`, `gradient[0/1]`, `success`, `warning`, `danger`) and rotated across slides by index.

## Further reading

- `docs/DOCUMENTATION-REVIEW.md` — how-to guides (new layout family, new theme, new content deck), key interface quick reference, known issues/tech debt.
- `docs/DECK-SHAPE-SPEC.md` — the `structure.js` + `content.json` shape contract per deck.
