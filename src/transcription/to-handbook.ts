/**
 * transcription/to-handbook.ts — Transcribe any supported source layout to
 * the "handbook" family (hb-chapter, hb-practices, hb-process,
 * hb-manifesto, hb-index).
 *
 * Extracted from transcription.ts (DECK-4). Pure extraction — no logic
 * changes; behavior is pinned by the characterization matrix in
 * transcription.test.ts.
 */

import { arr, type SlideItem, type Topic } from "./types.ts";

export function transcribeToHandbook(topic: Topic): Topic {
  switch (topic.layout) {
    case "two-col": return {
      ...topic, layout: "hb-chapter",
      eyebrow: topic.eyebrow || "Chapter",
      summary: topic.summary || topic.subtitle,
      heroPoints: topic.heroPoints || [],
      chapters: arr(topic.cards).map((c, i: number) => ({ num: `0${i+1}`, title: c.title, sub: c.body?.slice(0,60)||"" })),
    };
    case "stat-cards": return {
      ...topic, layout: "hb-practices",
      eyebrow: topic.kicker || "Practices",
      summary: topic.thesis || topic.subtitle,
      practices: arr(topic.cards).map((c) => ({ title: c.title, body: c.body || "", dark: false })),
    };
    case "process-cycle": return { ...topic, layout: "hb-process" };
    case "h-strip": return {
      ...topic, layout: "hb-manifesto",
      eyebrow: "Manifesto",
      statement: topic.title,
      beliefs: topic.heroPoints || arr(topic.cards).map((c) => c.title),
    };
    case "before-after": return {
      ...topic, layout: "hb-chapter",
      eyebrow: "Before → After",
      summary: topic.subtitle,
      heroPoints: arr(topic.cards).map((c) => `${c.title}: ${c.fix||""}`).slice(0,5),
      chapters: arr(topic.cards).map((c, i: number) => ({ num: `0${i+1}`, title: c.title, sub: c.fix?.slice(0,50)||"" })),
    };
    case "process-lanes": return {
      ...topic, layout: "hb-index",
      eyebrow: "Platforms",
      categories: arr(topic.lanes).map((l) => ({ label: l.title, body: l.subtitle || l.persona })),
    };
    // ── Info-rich source layouts → Handbook ─────────────────────────────────
    case "info-cards": return {
      ...topic, layout: "hb-practices",
      eyebrow: "Module",
      summary: topic.banner,
      practices: arr(topic.cards).map((c) => ({ title: c.title, body: c.body || "", dark: false })),
    };
    case "checklist": return {
      ...topic, layout: "hb-chapter",
      eyebrow: "Governance",
      summary: topic.subtitle,
      heroPoints: arr(topic.forbidden).map((i) => `${i.icon} ${i.title}`),
      chapters: arr(topic.approved).map((i, idx: number) => ({ num: `0${idx+1}`, title: i.title, sub: i.desc || "" })),
    };
    case "workflow": return {
      ...topic, layout: "hb-process",
      steps: arr(topic.steps).map((s) => ({ num: s.num || "", title: s.title, body: s.body || "" })),
    };
    case "pillars": return {
      ...topic, layout: "hb-index",
      categories: arr(topic.pillars).map((p) => ({ label: p.title, body: arr<unknown>(p.items).join(" · ") })),
    };
    case "catalog": return {
      ...topic, layout: "hb-index",
      categories: arr(topic.categories).map((c) => ({ label: c.title, body: arr<SlideItem | string>(c.items).map((i) => (typeof i === "string" ? i : (i.label || i))).join(" · ") })),
    };
    // ── Verge → Handbook ────────────────────────────────────────────────────
    case "stat-hero": return {
      ...topic, layout: "hb-practices",
      eyebrow: "Stats",
      summary: topic.subtitle,
      practices: arr(topic.statCards).map((c) => ({ title: `${c.value} ${c.label}`, body: c.body || "", dark: false })),
    };
    case "quote-collage": return {
      ...topic, layout: "hb-manifesto",
      eyebrow: "Manifesto",
      statement: arr(topic.quotes)[0]?.text || topic.title,
      beliefs: arr(topic.quotes).map((q) => q.text),
    };
    case "badge-grid": return {
      ...topic, layout: "hb-index",
      categories: arr(topic.badges).map((b) => ({ label: b.label || b.name || "", body: b.meta || "" })),
    };
    case "data-table": return {
      ...topic, layout: "hb-chapter",
      eyebrow: (topic.tableTitle as string) || "Data",
      summary: topic.subtitle,
      chapters: arr<unknown[]>(topic.tableRows).map((r, i: number) => ({ num: `0${i+1}`, title: (r[0] as string) || "", sub: ((r.slice?.(1) || []) as unknown[]).join(" · ") })),
    };
    case "bar-chart": return {
      ...topic, layout: "hb-practices",
      eyebrow: "Metrics",
      summary: topic.subtitle,
      practices: arr(topic.barGroups).map((g) => ({ title: g.label || "", body: arr(g.bars).map((b) => `${b.label}: ${b.value}`).join(", "), dark: false })),
    };
    case "color-blocks": return {
      ...topic, layout: "hb-chapter",
      eyebrow: "Overview",
      summary: topic.subtitle,
      chapters: arr(topic.blocks).map((b, i: number) => ({ num: `0${i+1}`, title: b.label || "", sub: b.body?.slice(0, 60) || "" })),
    };
    // ── Engineering → Handbook ──────────────────────────────────────────────
    case "eng-architecture": return {
      ...topic, layout: "hb-chapter",
      eyebrow: "Architecture",
      summary: topic.subtitle || topic.subheadline,
      chapters: arr(topic.cards).map((c, i: number) => ({ num: `0${i+1}`, title: c.title, sub: c.body?.slice(0, 60) || "" })),
    };
    case "eng-code-flow": return {
      ...topic, layout: "hb-process",
      steps: arr(topic.cards).map((c, i: number) => ({ num: `0${i+1}`, title: c.title, body: c.body || "" })),
    };
    case "eng-tech-stack": return {
      ...topic, layout: "hb-chapter",
      eyebrow: "Architecture",
      summary: topic.subtitle || topic.subheadline,
      chapters: arr(topic.cards).map((c, i: number) => ({ num: `0${i+1}`, title: c.title, sub: c.body?.slice(0, 60) || "" })),
    };
    case "eng-roadmap": return {
      ...topic, layout: "hb-chapter",
      eyebrow: "Architecture",
      summary: topic.subtitle || topic.subheadline,
      chapters: arr(topic.cards).map((c, i: number) => ({ num: `0${i+1}`, title: c.title, sub: c.body?.slice(0, 60) || "" })),
    };
    // ── Ops → Handbook ──────────────────────────────────────────────────────
    case "op-brief": return {
      ...topic, layout: "hb-practices",
      eyebrow: "One-Pager",
      summary: topic.headline,
      practices: arr(topic.cards).map((c) => ({ title: c.title, body: c.body || "", dark: false })),
    };
    case "op-flow": return {
      ...topic, layout: "hb-process",
      steps: arr(topic.steps ?? topic.cards).map((s, i: number) => ({ num: s.num || `0${i+1}`, title: s.title || "", body: s.body || "" })),
    };
    // ── Advocacy → Handbook ─────────────────────────────────────────────────
    case "adv-overview":
    case "advd-overview": return {
      ...topic, layout: "hb-chapter",
      eyebrow: "Overview",
      summary: topic.summary || topic.subtitle,
      heroPoints: topic.heroPoints || [],
      chapters: arr(topic.cards).map((c, i: number) => ({ num: `0${i+1}`, title: c.title, sub: c.body?.slice(0, 60) || "" })),
    };
    case "adv-stats":
    case "advd-stats": return {
      ...topic, layout: "hb-practices",
      eyebrow: "Stats",
      summary: topic.thesis,
      practices: arr(topic.cards).map((c) => ({ title: c.title, body: c.body || "", dark: false })),
    };
    case "adv-hurdles":
    case "advd-hurdles": return {
      ...topic, layout: "hb-chapter",
      eyebrow: "Challenges",
      summary: topic.subtitle,
      chapters: arr(topic.cards).map((c, i: number) => ({ num: `0${i+1}`, title: c.title, sub: c.challenge?.slice(0, 50) || "" })),
    };
    case "adv-future":
    case "advd-future": return {
      ...topic, layout: "hb-manifesto",
      eyebrow: "Vision",
      statement: topic.callout || topic.title,
      beliefs: arr(topic.cards).map((c) => c.title),
    };
    case "adv-platform":
    case "advd-platform": return {
      ...topic, layout: "hb-index",
      categories: arr(topic.capabilities).map((c) => ({ label: c.title, body: c.body || "" })),
    };
    default: return topic;
  }
}
