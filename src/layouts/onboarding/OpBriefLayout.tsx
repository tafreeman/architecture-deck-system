/**
 * OpBriefLayout — one-pager screen for cards/checklist/pillars topics.
 *
 * Extracted from genai_advocacy_hub_13.jsx (OpBriefScreen, layout id: "op-brief").
 */

import type { BaseTopicProps } from '../../layouts/registry.ts';
import { useState, useEffect } from "react";
import { useTheme } from "../../components/hooks/useTheme.ts";
import { useChrome } from "../../components/hooks/useChrome.ts";
import BackBtn from "../../components/navigation/BackBtn.tsx";
import { UI } from "../../tokens/ui-strings.ts";
import type { Theme } from "../../tokens/themes.ts";
import type { StyleMode } from "../../tokens/style-modes.ts";

/** Fields used by OpBriefLayout beyond the shared BaseTopicProps. */
interface OpBriefTopic extends BaseTopicProps {
  approved?: Array<Record<string, unknown>>;
  pillars?: Array<Record<string, unknown>>;
  forbidden?: unknown[];
  results?: Array<Record<string, unknown>>;
  banner?: string;
  subheadline?: string;
  headline?: string;
}

interface LayoutProps {
  topic: BaseTopicProps;
  onBack: () => void;
}

export function OpBriefLayout({ topic, onBack }: LayoutProps) {
  // Cast once at entry; family-specific fields are typed via OpBriefTopic.
  const top = topic as OpBriefTopic;
  const T = useTheme() as Theme;
  const C = useChrome() as StyleMode;
  const [entered, setEntered] = useState<boolean>(false);
  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const fade = (delay: number) => ({
    opacity: entered ? 1 : 0,
    transform: entered ? "none" : "translateY(10px)",
    transition: `all 0.5s ${delay}s cubic-bezier(0.22,1,0.36,1)`,
  });

  // Normalize cards from any content shape
  const cardItems = top.cards
    ? top.cards.slice(0, 4)
    : top.approved
    ? top.approved.slice(0, 4).map(a => ({ stat: a.icon, statLabel: "Approved", title: a.title, body: a.desc }))
    : (top.pillars ?? []).slice(0, 4).map(p => ({ stat: p.icon, statLabel: p.title, title: p.title, body: ((p.items as string[]) || [])[0] || "" }));

  const tags = top.cards
    ? top.cards.map(c => c.statLabel as string).filter(Boolean)
    : top.approved
    ? top.approved.slice(0, 4).map(a => a.title as string)
    : (top.pillars ?? []).map(p => p.title as string);

  const snapshotStats = top.cards
    ? top.cards.slice(0, 4).map(c => ({ val: c.stat as string, lbl: c.statLabel as string }))
    : top.approved
    ? [
        { val: String((top.approved ?? []).length), lbl: "Approved" },
        { val: String((top.forbidden ?? []).length), lbl: "Restricted" },
        { val: "Zero", lbl: "Tolerance" },
        { val: "Day 1", lbl: "Required" },
      ]
    : top.results
    ? top.results.slice(0, 4).map(r => ({ val: r.val as string, lbl: r.label as string }))
    : (top.pillars ?? []).slice(0, 4).map(p => ({ val: p.icon as string, lbl: p.title as string }));

  const talkingPoints = cardItems.map(c => c.title as string);
  const descText = top.banner || top.subheadline || top.subtitle;

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: T.bg, overflow: "hidden" }}>
      {/* Accent top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${top.color},${top.color}40,transparent)` }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "55%", background: `radial-gradient(ellipse at top right,${top.color}08,transparent 65%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "24px 32px" }}>
        <BackBtn onClick={onBack} />

        {/* ── ROW 1: Issue header + Snapshot ── */}
        <div style={{ ...fade(0.05), display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, marginBottom: 18 }}>
          {/* Left */}
          <div>
            <div style={{ fontSize: 9, fontFamily: T.fontDisplay, fontWeight: C.headingWeight, color: top.color, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>
              {top.icon} Module {top.order || "\u2014"} &nbsp;&middot;&nbsp; One-Pager
            </div>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: 40, fontWeight: C.headingWeight, color: T.text, lineHeight: 1.05, margin: "0 0 7px", letterSpacing: "-0.5px" }}>{top.title}</h1>
            <p style={{ fontFamily: T.fontDisplay, fontSize: 13.5, fontStyle: "italic", color: top.color, margin: "0 0 11px" }}>{top.subtitle}</p>
            {descText && <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.65, margin: "0 0 12px", maxWidth: 560 }}>{descText}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {tags.slice(0, 5).map((tg, i) => (
                <span key={i} style={{ fontSize: 9, fontFamily: T.fontDisplay, fontWeight: C.headingWeight, padding: "3px 10px", borderRadius: C.pillRadius, background: top.color + "18", color: top.color, letterSpacing: 0.5, border: `1px solid ${top.color}28` }}>{tg}</span>
              ))}
            </div>
          </div>
          {/* Right: snapshot */}
          <div style={{ background: T.bgCard, borderRadius: C.cardRadius, border: `1px solid ${top.color}22`, borderTop: `3px solid ${top.color}`, padding: "16px 18px" }}>
            <div style={{ fontSize: 8, fontFamily: T.fontDisplay, fontWeight: C.headingWeight, color: T.textDim, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12 }}>Snapshot</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {snapshotStats.slice(0, 4).map((s, i) => (
                <div key={i} style={{ padding: "9px 11px", background: T.bgDeep, borderRadius: C.innerRadius, borderLeft: `2px solid ${top.color}40` }}>
                  <div style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: C.headingWeight, color: top.color, lineHeight: 1, marginBottom: 2 }}>{s.val}</div>
                  <div style={{ fontSize: 8.5, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Context strip (3 col) ── */}
        <div style={{ ...fade(0.15), display: "grid", gridTemplateColumns: "1fr 1fr 1fr", border: `1px solid ${T.bgCard}`, borderRadius: C.innerRadius, overflow: "hidden", marginBottom: 16 }}>
          {[
            { label: "Overview", body: top.headline || top.title },
            { label: "What It Covers", items: talkingPoints },
            { label: "Core Principle", body: top.callout },
          ].map((col, i) => (
            <div key={i} style={{ padding: "13px 15px", background: i === 1 ? T.bgCard : T.bgDeep, borderLeft: i > 0 ? `1px solid ${T.bgCard}` : "none" }}>
              <div style={{ fontSize: 8, fontFamily: T.fontDisplay, fontWeight: C.headingWeight, color: top.color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>{col.label}</div>
              {col.body && <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, margin: 0 }}>{col.body}</p>}
              {col.items && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {col.items.map((it, j) => (
                    <div key={j} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: top.color, marginTop: 4, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.4 }}>{it}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── ROW 3: adaptive-col cards ── */}
        <div style={{ ...fade(0.24), display: "grid", gridTemplateColumns: `repeat(${Math.min(cardItems.length, 4)},1fr)`, gap: 10, marginBottom: 16 }}>
          {cardItems.map((c, i) => (
            <div key={i} style={{ background: T.bgCard, borderRadius: C.cardRadius, padding: "13px 15px", borderTop: `2px solid ${i === 0 ? top.color : top.color + "55"}` }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: C.headingWeight, color: top.color, lineHeight: 1 }}>{c.stat as string}</div>
                <div style={{ fontSize: 8, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{c.statLabel as string}</div>
              </div>
              <h4 style={{ fontFamily: T.fontDisplay, fontSize: 12, fontWeight: C.headingWeight, color: T.text, margin: "0 0 5px" }}>{c.title as string}</h4>
              <p style={{ fontSize: 10.5, color: T.textMuted, lineHeight: 1.55, margin: 0 }}>{typeof c.body === "string" ? (c.body.length > 110 ? c.body.slice(0, 110) + "\u2026" : c.body) : ""}</p>
            </div>
          ))}
        </div>

        {/* ── ROW 4: Talking Points + Bottom Line ── */}
        <div style={{ ...fade(0.32), display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: T.bgCard, borderRadius: C.cardRadius, padding: "14px 16px" }}>
            <div style={{ fontSize: 8, fontFamily: T.fontDisplay, fontWeight: C.headingWeight, color: T.textDim, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>{UI.SECTION.talkingPoints}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {talkingPoints.map((pt, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: T.fontDisplay, fontSize: 10.5, fontWeight: C.headingWeight, color: top.color, flexShrink: 0, minWidth: 20 }}>0{i + 1}</span>
                  <span style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{pt}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: top.color + "0F", borderRadius: C.cardRadius, padding: "14px 16px", border: `1px solid ${top.color}22`, borderLeft: `3px solid ${top.color}` }}>
            <div style={{ fontSize: 8, fontFamily: T.fontDisplay, fontWeight: C.headingWeight, color: top.color, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 9 }}>{UI.SECTION.bottomLine}</div>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>&ldquo;{top.callout}&rdquo;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpBriefLayout;
