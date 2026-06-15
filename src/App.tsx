/**
 * App.v14 — Registry-based presenter app (Phase 5, Strangler Fig).
 *
 * Key changes from v13 monolith:
 *   - Imports ThemeContext + ChromeContext from extracted context modules
 *   - Imports register-all.ts as a side-effect (populates layout registry)
 *   - Replaces 25-case renderActiveTopic() switch with <LayoutRenderer>
 *   - Imports CometTransition, ThematicIntro from extracted components
 *
 * All DECKS, createDeckPreset, and transcription functions are preserved
 * verbatim from the monolith — they are data/logic, not renderers.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ── Content imports ────────────────────────────────────────────────────────
import * as current from "./content/current/deck.js";
import { themeId as genaiThemeId, contentSlides as genaiContentSlides, sprintNodes as genaiSprintNodes, deckMeta as genaiDeckMeta } from "./content/genai-advocacy/deck.js";
import * as vergePop from "./content/verge-pop/deck.js";
import * as onboarding from "./content/onboarding/deck.js";
import * as onboardingOp from "./content/onboarding-op/deck.js";
import * as studio from "./content/studio/deck.js";
import * as engineering from "./content/engineering/deck.js";

// ── Token imports ─────────────────────────────────────────────────────────
import { THEMES, THEMES_BY_ID } from "./tokens/themes.ts";
import { resolveTopicColors, resolveIntroStatColors } from "./tokens/palette.ts";
import { STYLE_MODES, STYLE_MODES_BY_ID } from "./tokens/style-modes.ts";
import type { StyleModeId } from "./tokens/style-modes.ts";

/** Dynamic deck-content object (deck JSON is schema-light by design). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic deck content
type DeckContent = Record<string, any>;

// ── Design-system context (extracted) ─────────────────────────────────────
import { ThemeContext, ChromeContext } from "./components/context/index.ts";
import { usePresentationViewport } from "./components/hooks/index.ts";

// ── Extracted components ──────────────────────────────────────────────────
import { CometTransition, ThematicIntro } from "./components/animations/index.ts";
import { ControlPanel } from "./components/navigation/index.ts";
import type { DeckMeta } from "./components/navigation/types.ts";
import { DeckLanding, LayoutCyclerBar } from "./components/deck/index.ts";
export type { DeckLandingProps, LayoutCyclerBarProps } from "./components/deck/index.ts";

// ── Layout registry: side-effect import registers all 39 layouts ───────────
import "./layouts/register-all.ts";
import { layoutRegistry } from "./layouts/registry.ts";
import { LayoutRenderer } from "./layouts/LayoutRenderer.tsx";

// ── Transcription (cross-family layout normalisation) ─────────────────────
import { transcribeTopic } from "./transcription.ts";

// ── Content registry (runtime content swapping) ──────────────────────────
import {
  isContentSwappable,
  getAvailableContent,
  getDefaultContentId,
  buildDeckFromContent,
} from "./content/content-registry.ts";

// ═════════════════════════════════════════════════════════════════════
// STATIC DATA
// ═════════════════════════════════════════════════════════════════════

// Current deck data now lives in ./content/current/ (structure.js + content.json)

const LAYOUT_ICONS: Record<string, string> = {
  "two-col": "◌",
  "stat-cards": "◉",
  "before-after": "⬡",
  "process-cycle": "⟳",
  "h-strip": "△",
  "process-lanes": "▤",
  "stat-hero": "📊",
  "quote-collage": "💬",
  "badge-grid": "🏷️",
  "data-table": "📋",
  "bar-chart": "📈",
  "color-blocks": "🎨",
  "info-cards": "📋",
  "checklist": "🛡️",
  "workflow": "⚙️",
  "pillars": "🔬",
  "catalog": "🔐",
  "op-brief": "📑",
  "op-flow": "🔀",
  "hb-chapter": "📖",
  "hb-practices": "📝",
  "hb-process": "🔄",
  "hb-manifesto": "📜",
  "hb-index": "📇",
  "eng-architecture": "🏗️",
  "eng-code-flow": "🔗",
  "eng-tech-stack": "⚙️",
  "eng-roadmap": "🗺️",
};

const SPRINT_NODE_ICONS: Record<string, string> = {
  RQ: "📋",
  UI: "🖥️",
  AD: "🤖",
  RF: "✅",
  RV: "👥",
  AC: "⚙️",
  CO: "💻",
  PR: "👥",
  QA: "🧪",
  FX: "🐛",
  DP: "🚀",
  RO: "📊",
  BR: "📝",
  IN: "💡",
  FR: "🧩",
  ED: "✍️",
  ST: "🧠",
  CR: "🔎",
  AP: "✅",
  CL: "🗂️",
  TG: "🏷️",
  PL: "📈",
  PX: "📤",
};

// ═════════════════════════════════════════════════════════════════════
// DECK FACTORY
// ═════════════════════════════════════════════════════════════════════

function getInitialDeckKey() {
  const param = new URLSearchParams(globalThis.window?.location?.search ?? "").get("deck");
  return param || "onboarding";
}

function padTopicNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function normalizeSprintNodes(nodes: DeckContent[]) {
  return (nodes || []).map((node: DeckContent) => ({
    ...node,
    icon: node.icon || SPRINT_NODE_ICONS[node.abbr] || "•",
  }));
}

function normalizeDeckTopics(slides: DeckContent[]) {
  return (slides || []).map((slide: DeckContent, index: number) => ({
    ...slide,
    num: slide.num || padTopicNumber(index),
    icon: slide.icon || LAYOUT_ICONS[slide.layout] || "•",
    colorLight: slide.colorLight || slide.color,
    colorGlow: slide.colorGlow || `${slide.color}33`,
    cards: slide.cards || [],
    heroPoints: slide.heroPoints || [],
    talkingPoints: slide.talkingPoints || [],
    focusPanels: slide.focusPanels || [],
    capabilities: slide.capabilities || [],
    lanes: slide.lanes || [],
  }));
}

/**
 * A built deck preset. Carries the `DeckMeta` summary fields (`title`,
 * `titleAccent`) statically — every preset spreads a `deckMeta` that defines
 * them — while remaining schema-light for the rest of its dynamic content.
 */
type DeckPreset = DeckMeta & DeckContent;

function createDeckPreset(config: DeckMeta & DeckContent): DeckPreset {
  return {
    ...config,
    title: config.title,
    titleAccent: config.titleAccent,
    topics: normalizeDeckTopics(config.topics),
    sprintNodes: normalizeSprintNodes(config.sprintNodes),
  };
}

const CURRENT_DECK = createDeckPreset({
  id: "current",
  themeId: current.themeId,
  ...current.deckMeta,
  topics: current.contentSlides,
  sprintNodes: current.sprintNodes,
});

const GENAI_MANIFEST_DECK = createDeckPreset({
  id: "genai",
  themeId: genaiThemeId,
  ...genaiDeckMeta,
  topics: genaiContentSlides,
  sprintNodes: genaiSprintNodes,
});

const VERGE_POP_DECK = createDeckPreset({
  id: "verge-pop",
  themeId: vergePop.themeId,
  ...vergePop.deckMeta,
  topics: vergePop.contentSlides,
  sprintNodes: vergePop.sprintNodes,
});

const STUDIO_DECK = createDeckPreset({
  id: "studio",
  themeId: studio.themeId,
  ...studio.deckMeta,
  topics: studio.contentSlides,
  sprintNodes: studio.sprintNodes,
});

const ONBOARDING_OP_DECK = createDeckPreset({
  id: "onboarding-op",
  themeId: onboardingOp.themeId,
  ...onboardingOp.deckMeta,
  topics: onboardingOp.contentSlides,
  sprintNodes: onboardingOp.sprintNodes,
});

const ONBOARDING_DECK = createDeckPreset({
  id: "onboarding",
  themeId: onboarding.themeId,
  ...onboarding.deckMeta,
  topics: onboarding.contentSlides,
  sprintNodes: onboarding.sprintNodes,
});

const ENGINEERING_DECK = createDeckPreset({
  id: "engineering",
  themeId: engineering.themeId,
  ...engineering.deckMeta,
  topics: engineering.contentSlides,
  sprintNodes: engineering.sprintNodes,
});

const DECKS = {
  current: CURRENT_DECK,
  genai: GENAI_MANIFEST_DECK,
  "verge-pop": VERGE_POP_DECK,
  onboarding: ONBOARDING_DECK,
  "onboarding-op": ONBOARDING_OP_DECK,
  studio: STUDIO_DECK,
  engineering: ENGINEERING_DECK,
};

/**
 * Deck summaries for the ControlPanel deck picker — narrows each full deck
 * preset down to the `DeckMeta` fields the UI consumes. Built from `DECKS`
 * so it stays in sync, and gives the `decks` prop a real `Record<string, DeckMeta>`
 * type with no cast at the call site.
 */
const DECK_SUMMARIES: Record<string, DeckMeta> = Object.fromEntries(
  Object.entries(DECKS).map(([key, d]) => [
    key,
    { title: d.title, titleAccent: d.titleAccent },
  ]),
);

// ═════════════════════════════════════════════════════════════════════
// TRANSCRIPTION FUNCTIONS  (cross-family layout normalisation)
// ═════════════════════════════════════════════════════════════════════
// Extracted to ./transcription.ts — imported above.

const HERO_IMAGE_DEFAULT = "";

// ═════════════════════════════════════════════════════════════════════
// EXTRACTED COMPONENTS
// ═════════════════════════════════════════════════════════════════════
// DeckLanding and LayoutCyclerBar are imported from ./components/deck/index.ts
// (extracted as part of Fix #3 refactor). Their types are re-exported above.

// ═════════════════════════════════════════════════════════════════════
// APP
// ═════════════════════════════════════════════════════════════════════

export default function App() {
  const viewport = usePresentationViewport();
  const [deckKey, setDeckKey] = useState(getInitialDeckKey);
  const [contentKey, setContentKey] = useState<string | null>(null); // null = use deck's default content
  const baseDeck = (DECKS as Record<string, DeckContent>)[deckKey] || CURRENT_DECK;

  // Compute effective deck: if content is swapped, rebuild from structure + content
  const deck = useMemo(() => {
    const defaultId = getDefaultContentId(deckKey);
    const activeContentId = contentKey ?? defaultId;
    // Only rebuild when content is actually swapped on a migrated deck
    if (!activeContentId || !isContentSwappable(deckKey) || activeContentId === defaultId) {
      return baseDeck;
    }
    const merged = buildDeckFromContent(deckKey, activeContentId);
    if (!merged) return baseDeck;
    // Reshape merged result to match createDeckPreset output shape
    return {
      ...baseDeck,
      brandLine: merged.deckMeta.brandLine,
      title: merged.deckMeta.title,
      titleAccent: merged.deckMeta.titleAccent,
      tagline: merged.deckMeta.tagline,
      introTitle: merged.deckMeta.introTitle,
      introSubtitle: merged.deckMeta.introSubtitle,
      introStats: merged.deckMeta.introStats,
      stats: merged.deckMeta.stats,
      topics: merged.contentSlides,
      sprintNodes: merged.sprintNodes,
    };
  }, [deckKey, contentKey, baseDeck]);
  const [theme, setTheme] = useState(() => THEMES_BY_ID[deck.themeId] || THEMES[0]);
  const [themeManual, setThemeManual] = useState(false);
  const [renderFamily, setRenderFamily] = useState("native");
  const [styleModeId, setStyleModeId] = useState("default");
  const chrome = STYLE_MODES_BY_ID[styleModeId as StyleModeId];
  const [animOptions, setAnimOptions] = useState({ intro: false, comet: false });
  const [heroImage, setHeroImage] = useState(HERO_IMAGE_DEFAULT);
  const [heroImageEnabled, setHeroImageEnabled] = useState(true);
  const [slideViewMode, setSlideViewMode] = useState("native");
  const [layoutOverrides, setLayoutOverrides] = useState<Record<string, string>>({}); // { slideId: layoutId }
  const [introDone, setIntroDone] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [comet, setComet] = useState<{
    active: boolean;
    from: { x: number; y: number } | null;
    color: string | null;
    targetId: string | null;
  }>({ active: false, from: null, color: null, targetId: null });

  // Gate intro animation — skip when disabled, re-queue when enabled
  useEffect(() => {
    if (!animOptions.intro) setIntroDone(true);
    else setIntroDone(false);
  }, [animOptions.intro]);

  // ── Theme-adaptive color resolution + optional layout transcription ──
  const deckTopics = useMemo(() => {
    const colorResolved = theme ? resolveTopicColors(deck.topics, theme) : deck.topics;
    if (renderFamily === "native") return colorResolved;
    return colorResolved.map((t: DeckContent) =>
      transcribeTopic(t as Parameters<typeof transcribeTopic>[0], renderFamily),
    );
  }, [deck.topics, theme, renderFamily]);

  const introStats = useMemo(() =>
    theme ? resolveIntroStatColors(deck.introStats, theme) : deck.introStats,
    [deck.introStats, theme],
  );

  // Reset state when switching decks
  const switchDeck = (key: string) => {
    setDeckKey(key);
    setContentKey(null); // reset to deck's default content
    setLayoutOverrides({}); // reset all per-slide layout overrides
    setActive(null);
    setSlideViewMode("native");
    setIntroDone(!animOptions.intro);
    if (!themeManual) {
      const nextDeck = (DECKS as Record<string, DeckContent>)[key] || CURRENT_DECK;
      const suggested = THEMES_BY_ID[nextDeck.themeId];
      if (suggested) setTheme(suggested);
    }
  };

  const resetToDeckTheme = () => {
    setThemeManual(false);
    const suggested = THEMES_BY_ID[deck.themeId];
    if (suggested) setTheme(suggested);
  };

  const handleSelect = (id: string, pos: { x: number; y: number }) => {
    const topic = deckTopics.find((t: DeckContent) => t.id === id);
    setSlideViewMode("native");
    if (!animOptions.comet) {
      setActive(id);
      return;
    }
    setTransitioning(true);
    setComet({ active: true, from: pos, color: topic.color, targetId: id });
  };
  const cometRef = useRef(comet);
  useEffect(() => { cometRef.current = comet; });
  const handleCometDone = useCallback(() => {
    setActive(cometRef.current.targetId);
    setComet({ active: false, from: null, color: null, targetId: null });
    setTransitioning(false);
  }, []);
  const backTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (backTimeoutRef.current !== null) clearTimeout(backTimeoutRef.current); }, []);
  const handleBack = () => {
    setSlideViewMode("native");
    setTransitioning(true);
    if (backTimeoutRef.current !== null) clearTimeout(backTimeoutRef.current);
    backTimeoutRef.current = setTimeout(() => { setActive(null); setTransitioning(false); }, 350);
  };
  const activeTopic = deckTopics.find((t: DeckContent) => t.id === active);

  // Per-slide one-pager toggle: transcribe active topic when in onepager mode
  const effectiveTopic = useMemo(() => {
    if (!activeTopic || slideViewMode === "native") return activeTopic;
    return transcribeTopic(activeTopic, "onboarding");
  }, [activeTopic, slideViewMode]);

  const hasOnepagerView = activeTopic && !["op-brief", "op-flow"].includes(activeTopic.layout);

  // ── Per-slide layout cycling ──
  const allLayouts = useMemo(() => layoutRegistry.list(), []);
  const activeSlideLayout = activeTopic
    ? (layoutOverrides[activeTopic.id] ?? activeTopic.layout)
    : null;
  const activeLayoutIndex = activeSlideLayout ? allLayouts.indexOf(activeSlideLayout) : -1;

  const cycleLayout = useCallback((dir: number) => {
    if (!activeTopic) return;
    const currentIdx = allLayouts.indexOf(
      layoutOverrides[activeTopic.id] ?? activeTopic.layout
    );
    const nextIdx = (currentIdx + dir + allLayouts.length) % allLayouts.length;
    setLayoutOverrides(prev => ({ ...prev, [activeTopic.id]: allLayouts[nextIdx] }));
  }, [activeTopic, allLayouts, layoutOverrides]);

  const resetLayout = useCallback(() => {
    if (!activeTopic) return;
    setLayoutOverrides(prev => {
      const next = { ...prev };
      delete next[activeTopic.id];
      return next;
    });
  }, [activeTopic]);

  // Resolve ControlPanel feature manifest from the active slide's layout
  const activeLayoutFeatures = useMemo(() => {
    if (!activeTopic) return undefined; // landing grid — show deck-level defaults
    return layoutRegistry.getFeatures(activeTopic.layout);
  }, [activeTopic]);

  const T = theme;
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
          layout={activeSlideLayout ?? effectiveTopic.layout}
          slide={effectiveTopic}
          themeId={deck.themeId}
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
        deckThemeId={deck.themeId}
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
