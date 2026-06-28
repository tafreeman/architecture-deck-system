/**
 * App.v14 — Registry-based presenter app (Phase 5, Strangler Fig).
 *
 * A thin view: the deck factory lives in ./decks.ts and all presenter state
 * (deck/content selection, active slide, comet, theme, layout overrides, intro)
 * lives in the useDeckState hook. App wires their outputs into JSX.
 */

import React from "react";

// ── Token imports (ControlPanel option lists) ─────────────────────────────
import { THEMES } from "./tokens/themes.ts";
import { STYLE_MODES } from "./tokens/style-modes.ts";

// ── Deck factory (built presets) ──────────────────────────────────────────
import { DECKS, CURRENT_DECK, DECK_SUMMARIES } from "./decks.ts";

// ── Design-system context + state hook ─────────────────────────────────────
import { ThemeContext, ChromeContext } from "./components/context/index.ts";
import { usePresentationViewport, useDeckState } from "./components/hooks/index.ts";

// ── Extracted components ──────────────────────────────────────────────────
import { CometTransition, ThematicIntro } from "./components/animations/index.ts";
import { ControlPanel } from "./components/navigation/index.ts";
import { DeckLanding, LayoutCyclerBar } from "./components/deck/index.ts";
export type { DeckLandingProps, LayoutCyclerBarProps } from "./components/deck/index.ts";

import { LayoutRenderer } from "./layouts/LayoutRenderer.tsx";

// ── Content registry (runtime content swapping — UI queries) ──────────────
import {
  isContentSwappable,
  getAvailableContent,
  getDefaultContentId,
} from "./content/content-registry.ts";

// ═════════════════════════════════════════════════════════════════════
// APP
// ═════════════════════════════════════════════════════════════════════

export default function App() {
  const viewport = usePresentationViewport();
  const state = useDeckState({ decks: DECKS, currentDeck: CURRENT_DECK });
  const {
    deck, deckKey, contentKey, deckThemeId,
    theme: T, themeManual, chrome, styleModeId, setStyleModeId, setTheme, setThemeManual,
    renderFamily, setRenderFamily, animOptions, setAnimOptions,
    heroImage, setHeroImage, heroImageEnabled, setHeroImageEnabled,
    slideViewMode, setSlideViewMode, introDone, setIntroDone,
    active, setActive, transitioning, hovered, setHovered, comet,
    deckTopics, introStats, activeTopic, effectiveTopic, hasOnepagerView,
    allLayouts, activeSlideLayout, activeLayoutIndex, activeLayoutFeatures,
    setContentKey, switchDeck, resetToDeckTheme, handleSelect, handleCometDone,
    handleBack, cycleLayout, resetLayout,
  } = state;

  const introDeck = { ...deck, introStats };

  return (
    <ThemeContext.Provider value={T}>
    <ChromeContext.Provider value={chrome}>
    <div style={{ fontFamily: T.fontBody, minHeight: "100dvh", background: T.bg, opacity: (transitioning && !comet.active) ? 0 : 1, transition: "opacity 0.35s ease", overflowY: viewport.overlayScroll }}>
      <link href={T.fontsUrl} rel="stylesheet" />
      <CometTransition from={comet.from ?? undefined} color={comet.color ?? undefined} active={comet.active} onDone={handleCometDone} />
      {!introDone && animOptions.intro && <ThematicIntro deck={introDeck} onComplete={() => setIntroDone(true)} />}
      {!active && introDone && (
        <DeckLanding
          deck={deck}
          deckTopics={deckTopics}
          viewport={viewport}
          hovered={hovered}
          setHovered={setHovered}
          handleSelect={handleSelect}
          heroImage={heroImage}
          heroImageEnabled={heroImageEnabled}
          cometActive={comet.active}
        />
      )}
      {/* Per-slide one-pager toggle */}
      {activeTopic && hasOnepagerView && (
        <button type="button"
          onClick={() => setSlideViewMode(v => v === "native" ? "onepager" : "native")}
          style={{
            position: "fixed", top: 16, right: 60, zIndex: 200,
            background: slideViewMode === "onepager" ? `${T.accent}20` : T.bgCard,
            border: `1px solid ${slideViewMode === "onepager" ? T.accent + "60" : T.textDim + "30"}`,
            borderRadius: 999, padding: "5px 14px", fontSize: 10,
            color: slideViewMode === "onepager" ? T.accent : T.textDim,
            cursor: "pointer", fontFamily: T.fontBody, letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {slideViewMode === "onepager" ? "◉ One-Pager" : "◎ Slide"}
        </button>
      )}
      {/* ── Per-slide layout cycler ── */}
      {activeTopic && (
        <LayoutCyclerBar
          activeTopic={activeTopic}
          activeSlideLayout={activeSlideLayout!}
          allLayoutsLength={allLayouts.length}
          activeLayoutIndex={activeLayoutIndex}
          cycleLayout={cycleLayout}
          resetLayout={resetLayout}
        />
      )}
      {/* Active slide — registry-dispatched (replaces 25-case switch) */}
      {effectiveTopic && (
        <LayoutRenderer
          layout={(activeSlideLayout ?? effectiveTopic.layout) as string}
          slide={effectiveTopic}
          themeId={deckThemeId}
          onBack={handleBack}
          nodes={deck.sprintNodes}
        />
      )}
      {/* Floating design control panel */}
      <ControlPanel
        decks={DECK_SUMMARIES}
        deckKey={deckKey}
        onDeckChange={switchDeck}
        themes={[...THEMES]}
        theme={T}
        onThemeChange={(t) => { setThemeManual(true); setTheme(t); }}
        onThemeReset={resetToDeckTheme}
        themeManual={themeManual}
        deckThemeId={deckThemeId}
        styleModes={[...STYLE_MODES]}
        styleModeId={styleModeId}
        onStyleModeChange={setStyleModeId}
        renderFamily={renderFamily}
        onRenderFamilyChange={setRenderFamily}
        layoutFeatures={activeLayoutFeatures}
        animOptions={animOptions}
        onAnimOptionsChange={setAnimOptions}
        heroImage={heroImage}
        heroImageEnabled={heroImageEnabled}
        onHeroImageToggle={setHeroImageEnabled}
        onHeroImageChange={setHeroImage}
        contentSwappable={isContentSwappable(deckKey)}
        availableContent={isContentSwappable(deckKey) ? getAvailableContent(deckKey) : []}
        contentKey={contentKey ?? getDefaultContentId(deckKey)}
        onContentChange={(key) => { setContentKey(key); setActive(null); }}
      />
    </div>
    </ChromeContext.Provider>
    </ThemeContext.Provider>
  );
}

App.displayName = "AppV14";
