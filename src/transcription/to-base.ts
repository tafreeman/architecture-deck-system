/**
 * transcription/to-base.ts — Transcribe any supported source layout to the
 * "base" family (two-col, stat-cards, before-after, process-cycle, h-strip,
 * process-lanes).
 *
 * Extracted from transcription.ts (DECK-4). Pure extraction — no logic
 * changes; behavior is pinned by the characterization matrix in
 * transcription.test.ts.
 */

import { arr, type SlideItem, type Topic } from "./types.ts";

export function transcribeToBase(topic: Topic): Topic {
  switch (topic.layout) {
    case "info-cards": return {
      ...topic, layout: "stat-cards",
      kicker: `Module ${topic.order || ""}`,
      thesis: topic.banner || undefined,
      leadershipPoints: arr(topic.cards).map((c) => `${c.stat}${c.statLabel ? " "+c.statLabel : ""}: ${c.title}`),
      cards: arr(topic.cards).map((c) => ({ title: c.title, step: c.stat, eyebrow: c.statLabel, body: c.body })),
    };
    case "checklist": return {
      ...topic, layout: "two-col",
      summary: `${arr(topic.approved).length} approved tools · ${arr(topic.forbidden).length} prohibited practices`,
      heroPoints: arr(topic.approved).map((i) => i.title),
      cards: arr(topic.approved).map((i) => ({ title: i.title, body: i.desc })),
      talkingPoints: arr(topic.forbidden).map((i) => `${i.icon} ${i.title}: ${i.desc}`),
    };
    case "workflow": return {
      ...topic, layout: "two-col",
      summary: `${arr(topic.steps).filter((s)=>s.type==="human").length} human checkpoints · ${arr(topic.steps).filter((s)=>s.type==="ai").length} AI-assisted phases`,
      heroPoints: arr(topic.steps).map((s) => `${s.num}. ${s.title}`),
      cards: arr(topic.steps).map((s) => ({ title: `${s.num}. ${s.title}`, body: s.body })),
      talkingPoints: arr(topic.steps).filter((s) => s.tip).map((s) => `${s.title}: ${s.tip}`),
    };
    case "pillars": return {
      ...topic, layout: "stat-cards",
      kicker: `Module ${topic.order || ""}`,
      thesis: topic.subtitle,
      leadershipPoints: arr(topic.pillars).flatMap((p) => arr<unknown>(p.items).slice(0,2)),
      cards: arr(topic.pillars).map((p) => ({ title: p.title, step: p.icon||"", body: arr<unknown>(p.items).join(" · ") })),
      results: arr(topic.results).map((r) => ({ value: r.val, label: r.label })),
    };
    case "catalog": return {
      ...topic, layout: "two-col",
      summary: topic.subtitle,
      heroPoints: arr(topic.categories).map((c) => c.title),
      cards: arr(topic.categories).map((c) => ({ title: c.title, body: arr<SlideItem | string>(c.items).map((i)=>(typeof i === "string" ? i : (i.label||i))).join(" · ") })),
      talkingPoints: arr(topic.categories).flatMap((c) => arr<SlideItem | string>(c.items).map((i) => (typeof i === "string" ? `${i}: ` : `${i.label||i}: ${i.desc||""}`).trim())),
    };
    case "hb-chapter": return {
      ...topic, layout: "two-col",
      summary: topic.summary,
      heroPoints: arr(topic.chapters).map((c) => `${c.num}. ${c.title} — ${c.sub}`),
      cards: arr(topic.chapters).map((c) => ({ title: c.title, body: c.sub })),
      talkingPoints: topic.heroPoints || [],
    };
    case "hb-practices": return {
      ...topic, layout: "stat-cards",
      kicker: topic.eyebrow,
      thesis: topic.summary,
      cards: arr(topic.practices).map((p, i: number) => ({ title: p.title, step: `0${i+1}`, body: p.body })),
    };
    case "hb-process": return {
      ...topic, layout: "process-cycle",
    };
    case "hb-manifesto": return {
      ...topic, layout: "h-strip",
      heroPoints: topic.beliefs || [],
      cards: arr<string>(topic.beliefs).map((b) => ({ title: b, body: "" })),
    };
    case "hb-index": return {
      ...topic, layout: "two-col",
      summary: topic.subtitle,
      heroPoints: arr(topic.categories).map((c) => c.label),
      cards: arr(topic.categories).map((c) => ({ title: c.label, body: c.body })),
      talkingPoints: [],
    };
    // ── Verge → Base ────────────────────────────────────────────────────────
    case "stat-hero": return {
      ...topic, layout: "stat-cards",
      cards: arr(topic.statCards).map((c) => ({ title: c.body?.slice(0,40)||"", stat: c.value, statLabel: c.label, body: c.body||"" })),
    };
    case "quote-collage": return {
      ...topic, layout: "h-strip",
      cards: arr(topic.quotes).map((q) => ({ title: q.text, body: q.attr||"" })),
    };
    case "badge-grid": return {
      ...topic, layout: "two-col",
      heroPoints: arr(topic.badges).map((b) => b.label),
      cards: arr(topic.badges).map((b) => ({ title: b.label, body: b.meta||"" })),
    };
    case "data-table": return {
      ...topic, layout: "stat-cards",
      cards: arr<unknown[]>(topic.tableRows).map((r) => ({ title: (r[0] as string)||"", body: ((r.slice?.(1)||[]) as unknown[]).join(" · "), stat: "", statLabel: "" })),
    };
    case "bar-chart": return {
      ...topic, layout: "stat-cards",
      cards: arr(topic.barGroups).map((g) => ({ title: g.label||"", body: arr(g.bars).map((b) => `${b.label}: ${b.value}`).join(", "), stat: "" })),
    };
    case "color-blocks": return {
      ...topic, layout: "two-col",
      cards: arr(topic.blocks).map((b) => ({ title: b.label||"", body: b.body||"" })),
    };
    // ── Engineering → Base ──────────────────────────────────────────────────
    case "eng-architecture": return {
      ...topic, layout: "stat-cards",
      cards: arr(topic.cards).map((c) => ({ title: c.title, body: c.body||"", stat: c.stat||"", statLabel: c.statLabel||"" })),
    };
    case "eng-code-flow": return {
      ...topic, layout: "two-col",
      cards: arr(topic.cards).map((c) => ({ title: c.title, body: c.body||"" })),
    };
    case "eng-tech-stack": return {
      ...topic, layout: "stat-cards",
      cards: arr(topic.cards).map((c) => ({ title: c.title, body: c.body||"", stat: c.stat||"", statLabel: "" })),
    };
    case "eng-roadmap": return {
      ...topic, layout: "h-strip",
      cards: arr(topic.cards).map((c) => ({ title: c.title, body: c.body||"" })),
    };
    // ── Ops → Base ──────────────────────────────────────────────────────────
    case "op-brief": return {
      ...topic, layout: "stat-cards",
      kicker: topic.headline,
      cards: topic.cards,
    };
    case "op-flow": return {
      ...topic, layout: "two-col",
      cards: arr(topic.steps ?? topic.cards).map((s) => ({ title: s.title||s.num||"", body: s.body||"" })),
    };
    // ── Advocacy → Base ─────────────────────────────────────────────────────
    case "adv-overview":
    case "advd-overview": return {
      ...topic, layout: "two-col",
      heroPoints: topic.heroPoints,
      cards: topic.cards,
      talkingPoints: topic.talkingPoints,
    };
    case "adv-stats":
    case "advd-stats": return {
      ...topic, layout: "stat-cards",
      thesis: topic.thesis,
      cards: arr(topic.cards).map((c) => ({ ...c, stat: c.step||c.stat||"", statLabel: c.eyebrow||c.statLabel||"" })),
    };
    case "adv-hurdles":
    case "advd-hurdles": return {
      ...topic, layout: "before-after",
      cards: topic.cards,
    };
    case "adv-future":
    case "advd-future": return {
      ...topic, layout: "h-strip",
      cards: topic.cards,
      callout: topic.callout,
    };
    case "adv-platform":
    case "advd-platform": return {
      ...topic, layout: "process-lanes",
      focusPanels: topic.focusPanels,
      capabilities: topic.capabilities,
      lanes: topic.lanes,
    };
    default: return topic;
  }
}
