/**
 * DeckLanding — landing grid shown when no slide is active.
 *
 * Extracted from App.v14 (Phase 5 Strangler Fig) as a self-contained component.
 * Renders the hero header, topic tile grid, optional one-pager links, and
 * footer stats row. `deck.stats` is optional; the footer section is omitted
 * when absent to avoid a runtime crash.
 */

import React, { useContext } from "react";

import { ThemeContext, ChromeContext } from "../context/index.ts";
import { LandingTile } from "../cards/index.ts";
import { OptionalDeckLink, type TopicShape } from "../navigation/index.ts";
import type { DeckData, DeckSlide } from "../navigation/types.ts";
import type { PresentationViewport } from "../hooks/usePresentationViewport.ts";

/** A single stats entry displayed in the landing footer. */
interface StatEntry {
  val: string;
  lbl: string;
}

export interface DeckLandingProps {
  deck: DeckData;
  deckTopics: DeckSlide[];
  viewport: PresentationViewport;
  hovered: string | null;
  setHovered: (id: string | null) => void;
  handleSelect: (id: string, pos: { x: number; y: number }) => void;
  heroImage: string;
  heroImageEnabled: boolean;
  cometActive: boolean;
}

export function DeckLanding({
  deck,
  deckTopics,
  viewport,
  hovered,
  setHovered,
  handleSelect,
  heroImage,
  heroImageEnabled,
  cometActive,
}: DeckLandingProps) {
  const T = useContext(ThemeContext);
  const chrome = useContext(ChromeContext);

  const stats: readonly StatEntry[] = deck.stats ?? [];

  return (
    <div style={{ position: "relative", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center", padding: `${viewport.pagePaddingTop}px ${viewport.pagePaddingX}px ${viewport.pagePaddingBottom}px`, opacity: cometActive ? 0 : 1, transition: "opacity 0.4s ease" }}>
      {/* Hero background image layer */}
      {heroImageEnabled && heroImage && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: `url("${heroImage}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", opacity: 0.22, borderRadius: "inherit" }} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: viewport.isPhone ? 24 : 32 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: T.textDim, fontFamily: T.fontDisplay, fontWeight: 500, marginBottom: 10 }}>{deck.brandLine}</div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: viewport.heroTitleSize, fontWeight: chrome.headingWeight, color: T.text, margin: "0 0 10px", letterSpacing: -1, lineHeight: 1.05, textTransform: chrome.headingTransform }}>
            {deck.title}<br /><span style={{ background: `linear-gradient(90deg,${T.gradient[0]},${T.gradient[1]})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{deck.titleAccent}</span>
          </h1>
          <p style={{ fontSize: viewport.bodySize, color: T.textDim, margin: 0, maxWidth: viewport.isPhone ? "100%" : 600 }}>{deck.tagline}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: viewport.isPhone ? "1fr" : viewport.isCompact ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: viewport.cardGap }}>
          {deckTopics.map((t) => (
            <LandingTile
              key={t.id}
              title={t.title}
              subtitle={t.subtitle ?? ""}
              icon={t.icon ?? "•"}
              num={t.num ?? ""}
              color={t.color}
              colorLight={t.colorLight ?? t.color}
              colorGlow={t.colorGlow ?? `${t.color}33`}
              onClick={(pos) => handleSelect(t.id, pos)}
              hovered={hovered === t.id}
              onHover={(isHovered) => setHovered(isHovered ? t.id : null)}
            />
          ))}
        </div>
        {/* Optional one-pager links */}
        {deckTopics.filter((t) => t.optional).map((t) => (
          <OptionalDeckLink
            key={`opt-${t.id}`}
            topic={t as unknown as TopicShape}
            theme={T}
            chrome={chrome}
            onNavigate={(id, pos) => handleSelect(id, pos)}
          />
        ))}
        {/* ── Footer: stats (omitted when deck has no stats) ── */}
        {stats.length > 0 && (
          <div style={{ marginTop: viewport.isPhone ? 24 : 32, paddingTop: 20, borderTop: `1px solid ${T.border || "rgba(255,255,255,0.06)"}` }}>
            <div style={{ display: "grid", gridTemplateColumns: viewport.isPhone ? "1fr 1fr" : "repeat(3, minmax(0, max-content))", gap: viewport.isPhone ? 12 : 36 }}>
              {stats.map((s) => (
                <div key={`${s.lbl}-${s.val}`}><div style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, color: T.accent }}>{s.val}</div><div style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.lbl}</div></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
