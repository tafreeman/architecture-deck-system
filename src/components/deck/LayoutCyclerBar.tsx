/**
 * LayoutCyclerBar — floating pill bar that lets devs cycle through all
 * registered layouts for the active slide without leaving the presenter.
 *
 * Extracted from App.v14 (Phase 5 Strangler Fig).
 */

import React, { useContext } from "react";

import { ThemeContext } from "../context/index.ts";
import type { DeckSlide } from "../navigation/types.ts";

export interface LayoutCyclerBarProps {
  activeTopic: DeckSlide;
  activeSlideLayout: string;
  allLayoutsLength: number;
  activeLayoutIndex: number;
  cycleLayout: (dir: number) => void;
  resetLayout: () => void;
}

export function LayoutCyclerBar({
  activeTopic,
  activeSlideLayout,
  allLayoutsLength,
  activeLayoutIndex,
  cycleLayout,
  resetLayout,
}: LayoutCyclerBarProps) {
  const T = useContext(ThemeContext);
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, display: "flex", alignItems: "center", gap: 8,
      background: "rgba(8,10,24,0.92)", backdropFilter: "blur(12px)",
      border: `1px solid ${activeSlideLayout !== activeTopic.layout ? T.accent + "50" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 999, padding: "6px 8px",
    }}>
      <button type="button"
        onClick={() => cycleLayout(-1)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.5)", fontSize: 14, padding: "2px 6px",
          fontFamily: "monospace",
        }}
      >◂</button>
      <span style={{
        fontSize: 10, fontFamily: "'Space Grotesk',sans-serif",
        color: activeSlideLayout !== activeTopic.layout ? T.accent : "rgba(255,255,255,0.5)",
        letterSpacing: 0.5, minWidth: 100, textAlign: "center",
        fontWeight: activeSlideLayout !== activeTopic.layout ? 600 : 400,
      }}>
        {activeSlideLayout}
      </span>
      <button type="button"
        onClick={() => cycleLayout(1)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.5)", fontSize: 14, padding: "2px 6px",
          fontFamily: "monospace",
        }}
      >▸</button>
      {activeSlideLayout !== activeTopic.layout && (
        <button type="button"
          onClick={resetLayout}
          title="Reset to default layout"
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, color: "rgba(255,255,255,0.35)", padding: "2px 6px",
            fontFamily: "'Space Grotesk',sans-serif",
          }}
        >↺</button>
      )}
      <span style={{
        fontSize: 9, color: "rgba(255,255,255,0.2)",
        fontFamily: "monospace",
      }}>
        {activeLayoutIndex + 1}/{allLayoutsLength}
      </span>
    </div>
  );
}
