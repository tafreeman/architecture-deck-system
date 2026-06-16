/**
 * useDeckState — the presenter's deck-state machine, extracted from App.v14.
 *
 * Owns every piece of presenter state (deck/content selection, active slide,
 * comet transition, theme + style chrome, per-slide layout overrides, intro
 * gating) and all the derived values and handlers App renders from. App.tsx is
 * left as a thin view that wires this hook's return value into JSX.
 *
 * The deck data (`decks`, `currentDeck`) is passed in rather than imported so
 * the deck factory keeps living in App.tsx — this hook is pure state logic.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { THEMES, THEMES_BY_ID } from "../../tokens/themes.ts";
import type { Theme } from "../../tokens/themes.ts";
import { resolveTopicColors, resolveIntroStatColors } from "../../tokens/palette.ts";
import type { IntroStat } from "../../tokens/palette.ts";
import { STYLE_MODES_BY_ID } from "../../tokens/style-modes.ts";
import type { StyleModeId } from "../../tokens/style-modes.ts";

import { layoutRegistry } from "../../layouts/registry.ts";
import type { LayoutFeatures } from "../../layouts/registry.ts";
import { transcribeTopic } from "../../transcription.ts";
import {
  isContentSwappable,
  getDefaultContentId,
  buildDeckFromContent,
} from "../../content/content-registry.ts";
import { normalizeDeckTopics, normalizeSprintNodes } from "../../decks.ts";

import type { DeckData, DeckSlide, RawDeckSlide } from "../navigation/types.ts";

// ── Comet-transition state ──────────────────────────────────────────────────

export interface CometState {
  active: boolean;
  from: { x: number; y: number } | null;
  color: string | null;
  targetId: string | null;
}

const COMET_IDLE: CometState = { active: false, from: null, color: null, targetId: null };

/** Read the initial deck key from the `?deck=` URL param (defaults to onboarding). */
export function getInitialDeckKey(): string {
  const param = new URLSearchParams(globalThis.window?.location?.search ?? "").get("deck");
  return param || "onboarding";
}

export interface UseDeckStateArgs {
  /** Built deck presets keyed by deck id. */
  readonly decks: Record<string, DeckData>;
  /** Fallback deck when a key is unknown. */
  readonly currentDeck: DeckData;
}

export interface UseDeckState {
  // Deck + content selection
  deck: DeckData;
  deckKey: string;
  contentKey: string | null;
  deckThemeId: string;
  // Theme + chrome
  theme: Theme;
  themeManual: boolean;
  chrome: ReturnType<typeof resolveChrome>;
  styleModeId: string;
  setStyleModeId: (id: string) => void;
  setTheme: (theme: Theme) => void;
  setThemeManual: (manual: boolean) => void;
  // Render family + style toggles
  renderFamily: string;
  setRenderFamily: (family: string) => void;
  animOptions: { intro: boolean; comet: boolean };
  setAnimOptions: (opts: { intro: boolean; comet: boolean }) => void;
  heroImage: string;
  setHeroImage: (url: string) => void;
  heroImageEnabled: boolean;
  setHeroImageEnabled: (enabled: boolean) => void;
  // Slide view + transitions
  slideViewMode: string;
  setSlideViewMode: React.Dispatch<React.SetStateAction<string>>;
  introDone: boolean;
  setIntroDone: (done: boolean) => void;
  active: string | null;
  setActive: (id: string | null) => void;
  transitioning: boolean;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  comet: CometState;
  // Derived
  deckTopics: DeckSlide[];
  introStats: IntroStat[];
  activeTopic: DeckSlide | undefined;
  effectiveTopic: DeckSlide | undefined;
  hasOnepagerView: boolean | undefined;
  allLayouts: string[];
  activeSlideLayout: string | null;
  activeLayoutIndex: number;
  activeLayoutFeatures: LayoutFeatures | undefined;
  // Handlers
  setContentKey: (key: string | null) => void;
  switchDeck: (key: string) => void;
  resetToDeckTheme: () => void;
  handleSelect: (id: string, pos: { x: number; y: number }) => void;
  handleCometDone: () => void;
  handleBack: () => void;
  cycleLayout: (dir: number) => void;
  resetLayout: () => void;
}

function resolveChrome(styleModeId: string) {
  return STYLE_MODES_BY_ID[styleModeId as StyleModeId];
}

export function useDeckState({ decks, currentDeck }: UseDeckStateArgs): UseDeckState {
  const [deckKey, setDeckKey] = useState(getInitialDeckKey);
  const [contentKey, setContentKey] = useState<string | null>(null); // null = use deck's default content
  const baseDeck = decks[deckKey] || currentDeck;

  // Compute effective deck: if content is swapped, rebuild from structure + content
  const deck = useMemo<DeckData>(() => {
    const defaultId = getDefaultContentId(deckKey);
    const activeContentId = contentKey ?? defaultId;
    // Only rebuild when content is actually swapped on a migrated deck
    if (!activeContentId || !isContentSwappable(deckKey) || activeContentId === defaultId) {
      return baseDeck;
    }
    const merged = buildDeckFromContent(deckKey, activeContentId);
    if (!merged) return baseDeck;
    // Reshape merged result to match createDeckPreset output shape. The merge
    // layer's slide/node arrays are schema-light, so cast to the DeckData shape.
    // Spread merged.deckMeta (rather than assigning each optional field, which
    // would set absent keys to `undefined` and clobber baseDeck values), and run
    // the swapped slides/nodes through the SAME normalizers the static decks use
    // so they get num/icon/color defaults instead of rendering bare.
    return {
      ...baseDeck,
      ...merged.deckMeta,
      topics: normalizeDeckTopics(
        merged.contentSlides as unknown as readonly RawDeckSlide[],
      ),
      sprintNodes: normalizeSprintNodes(merged.sprintNodes),
    } as unknown as DeckData;
  }, [deckKey, contentKey, baseDeck]);

  const [theme, setTheme] = useState<Theme>(
    () => (deck.themeId ? THEMES_BY_ID[deck.themeId] : undefined) || THEMES[0],
  );
  const [themeManual, setThemeManual] = useState(false);
  const [renderFamily, setRenderFamily] = useState("native");
  const [styleModeId, setStyleModeId] = useState("default");
  const chrome = resolveChrome(styleModeId);
  const [animOptions, setAnimOptions] = useState({ intro: false, comet: false });
  const [heroImage, setHeroImage] = useState("");
  const [heroImageEnabled, setHeroImageEnabled] = useState(true);
  const [slideViewMode, setSlideViewMode] = useState("native");
  const [layoutOverrides, setLayoutOverrides] = useState<Record<string, string>>({}); // { slideId: layoutId }
  const [introDone, setIntroDone] = useState(true);
  const [active, setActive] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [comet, setComet] = useState<CometState>(COMET_IDLE);

  // Gate intro animation — skip when disabled, re-queue when enabled
  useEffect(() => {
    if (!animOptions.intro) setIntroDone(true);
    else setIntroDone(false);
  }, [animOptions.intro]);

  // ── Theme-adaptive color resolution + optional layout transcription ──
  const deckTopics = useMemo<DeckSlide[]>(() => {
    const topics: readonly RawDeckSlide[] = deck.topics ?? [];
    const colorResolved = theme ? resolveTopicColors(topics, theme) : topics;
    if (renderFamily === "native") return colorResolved as unknown as DeckSlide[];
    return colorResolved.map((t) =>
      transcribeTopic(t as Parameters<typeof transcribeTopic>[0], renderFamily),
    ) as unknown as DeckSlide[];
  }, [deck.topics, theme, renderFamily]);

  const introStats = useMemo(() => {
    // resolveIntroStatColors fills in each stat's `color`; deck content supplies
    // only { val, lbl }, so cast through the function's required IntroStat input.
    const stats = (deck.introStats ?? []) as Parameters<typeof resolveIntroStatColors>[0];
    return theme ? resolveIntroStatColors(stats, theme) : stats.map((s) => ({ ...s }));
  }, [deck.introStats, theme]);

  // Reset state when switching decks
  const switchDeck = (key: string) => {
    setDeckKey(key);
    setContentKey(null); // reset to deck's default content
    setLayoutOverrides({}); // reset all per-slide layout overrides
    setActive(null);
    setSlideViewMode("native");
    setIntroDone(!animOptions.intro);
    if (!themeManual) {
      const nextDeck = decks[key] || currentDeck;
      const suggested = nextDeck.themeId ? THEMES_BY_ID[nextDeck.themeId] : undefined;
      if (suggested) setTheme(suggested);
    }
  };

  const resetToDeckTheme = () => {
    setThemeManual(false);
    const suggested = deck.themeId ? THEMES_BY_ID[deck.themeId] : undefined;
    if (suggested) setTheme(suggested);
  };

  const handleSelect = (id: string, pos: { x: number; y: number }) => {
    const topic = deckTopics.find((t) => t.id === id);
    setSlideViewMode("native");
    if (!animOptions.comet) {
      setActive(id);
      return;
    }
    setTransitioning(true);
    setComet({ active: true, from: pos, color: topic?.color ?? null, targetId: id });
  };

  const cometRef = useRef(comet);
  useEffect(() => { cometRef.current = comet; });
  const handleCometDone = useCallback(() => {
    setActive(cometRef.current.targetId);
    setComet(COMET_IDLE);
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

  const activeTopic = deckTopics.find((t) => t.id === active);

  // Per-slide one-pager toggle: transcribe active topic when in onepager mode
  const effectiveTopic = useMemo(() => {
    if (!activeTopic || slideViewMode === "native") return activeTopic;
    return transcribeTopic(
      activeTopic as Parameters<typeof transcribeTopic>[0],
      "onboarding",
    ) as unknown as DeckSlide;
  }, [activeTopic, slideViewMode]);

  const activeTopicLayout = (activeTopic?.layout ?? "") as string;
  const hasOnepagerView = activeTopic && !["op-brief", "op-flow"].includes(activeTopicLayout);

  // ── Per-slide layout cycling ──
  const allLayouts = useMemo(() => layoutRegistry.list(), []);
  const activeSlideLayout = activeTopic
    ? (layoutOverrides[activeTopic.id] ?? activeTopicLayout)
    : null;
  const activeLayoutIndex = activeSlideLayout ? allLayouts.indexOf(activeSlideLayout) : -1;

  const cycleLayout = useCallback((dir: number) => {
    if (!activeTopic) return;
    const currentIdx = allLayouts.indexOf(
      layoutOverrides[activeTopic.id] ?? (activeTopic.layout ?? ""),
    );
    const nextIdx = (currentIdx + dir + allLayouts.length) % allLayouts.length;
    setLayoutOverrides((prev) => ({ ...prev, [activeTopic.id]: allLayouts[nextIdx] }));
  }, [activeTopic, allLayouts, layoutOverrides]);

  const resetLayout = useCallback(() => {
    if (!activeTopic) return;
    setLayoutOverrides((prev) => {
      const next = { ...prev };
      delete next[activeTopic.id];
      return next;
    });
  }, [activeTopic]);

  // Resolve ControlPanel feature manifest from the active slide's layout
  const activeLayoutFeatures = useMemo(() => {
    if (!activeTopic?.layout) return undefined; // landing grid — show deck-level defaults
    return layoutRegistry.getFeatures(activeTopic.layout);
  }, [activeTopic]);

  // `deck.themeId` is optional on DeckData; fall back to the active theme's id
  // so the value passed to LayoutRenderer / ControlPanel is always a string.
  const deckThemeId = deck.themeId ?? theme.id;

  return {
    deck,
    deckKey,
    contentKey,
    deckThemeId,
    theme,
    themeManual,
    chrome,
    styleModeId,
    setStyleModeId,
    setTheme,
    setThemeManual,
    renderFamily,
    setRenderFamily,
    animOptions,
    setAnimOptions,
    heroImage,
    setHeroImage,
    heroImageEnabled,
    setHeroImageEnabled,
    slideViewMode,
    setSlideViewMode,
    introDone,
    setIntroDone,
    active,
    setActive,
    transitioning,
    hovered,
    setHovered,
    comet,
    deckTopics,
    introStats,
    activeTopic,
    effectiveTopic,
    hasOnepagerView,
    allLayouts,
    activeSlideLayout,
    activeLayoutIndex,
    activeLayoutFeatures,
    setContentKey,
    switchDeck,
    resetToDeckTheme,
    handleSelect,
    handleCometDone,
    handleBack,
    cycleLayout,
    resetLayout,
  };
}
