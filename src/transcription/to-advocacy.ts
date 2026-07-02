/**
 * transcription/to-advocacy.ts — Transcribe to the "advocacy" family
 * (adv-overview, adv-stats, adv-hurdles, adv-future, adv-platform).
 * Extracted from transcription.ts (DECK-4); pure extraction, no logic
 * changes — pinned by the characterization matrix in transcription.test.ts.
 */

import { arr, itemText, type SlideItem, type Topic } from "./types.ts";

export function transcribeToAdvocacy(topic: Topic): Topic {
  switch (topic.layout) {
    case "info-cards": return {
      ...topic, layout: "adv-stats",
      thesis: topic.banner,
      cards: arr(topic.cards).map((c) => ({
        title: c.title, body: c.body,
        step: c.stat, eyebrow: c.statLabel,
        marker: c.icon || "○",
      })),
    };
    case "checklist": return {
      ...topic, layout: "adv-overview",
      heroPoints: arr(topic.approved).map((i) => i.title),
      cards: arr(topic.approved).map((i) => ({ title: i.title, body: i.desc })),
      talkingPoints: arr(topic.forbidden).map((i) => `${i.icon} ${i.title}`),
    };
    case "workflow": return {
      ...topic, layout: "adv-hurdles",
      cards: arr(topic.steps).map((s) => ({
        title: s.title,
        challenge: s.body,
        fix: s.tip || (s.type === "ai" ? "AI-assisted" : "Human review"),
      })),
    };
    case "pillars": return {
      ...topic, layout: "adv-platform",
      capabilities: arr(topic.pillars).flatMap((p) => arr<SlideItem | string>(p.items).map((i) => ({
        icon: p.icon || "●", title: itemText(i), body: "",
      }))),
      focusPanels: arr(topic.results).map((r) => ({ label: r.val, title: r.label, body: "" })),
    };
    case "catalog": return {
      ...topic, layout: "adv-future",
      cards: arr(topic.categories).slice(0, 4).map((c) => ({
        title: c.title,
        body: arr<SlideItem | string>(c.items).slice(0, 3).map(itemText).join(" · "),
      })),
    };
    // ── Base → Advocacy ─────────────────────────────────────────────────────
    case "two-col": return {
      ...topic, layout: "adv-overview",
      heroPoints: topic.heroPoints,
      cards: topic.cards,
      talkingPoints: topic.talkingPoints,
      summary: topic.summary,
    };
    case "stat-cards": return {
      ...topic, layout: "adv-stats",
      thesis: topic.thesis || topic.kicker,
      cards: arr(topic.cards).map((c) => ({
        title: c.title, body: c.body || "",
        step: c.stat || c.step || "", eyebrow: c.statLabel || c.eyebrow || "",
        marker: c.icon || "○",
      })),
    };
    case "before-after": return {
      ...topic, layout: "adv-hurdles",
      cards: arr(topic.cards).map((c) => ({
        title: c.title, challenge: c.challenge || "", fix: c.fix || "",
      })),
    };
    case "h-strip": return {
      ...topic, layout: "adv-future",
      cards: topic.cards,
      callout: topic.callout,
    };
    case "process-lanes": return {
      ...topic, layout: "adv-platform",
      focusPanels: topic.focusPanels,
      capabilities: topic.capabilities,
      lanes: topic.lanes,
      eyebrow: topic.eyebrow,
    };
    // ── Handbook → Advocacy ─────────────────────────────────────────────────
    case "hb-chapter": return {
      ...topic, layout: "adv-overview",
      heroPoints: topic.heroPoints || [],
      cards: arr(topic.chapters).map((c) => ({ title: c.title, body: c.sub || "" })),
      summary: topic.summary,
    };
    case "hb-practices": return {
      ...topic, layout: "adv-stats",
      thesis: topic.summary,
      cards: arr(topic.practices).map((c) => ({
        title: c.title, body: c.body || "",
        step: "", eyebrow: "", marker: "○",
      })),
    };
    case "hb-manifesto": return {
      ...topic, layout: "adv-future",
      callout: topic.statement || "",
      cards: arr<string>(topic.beliefs).map((b) => ({ title: b, body: "" })),
    };
    case "hb-index": return {
      ...topic, layout: "adv-platform",
      capabilities: arr(topic.categories).map((c) => ({
        icon: "●", title: c.label || "", body: c.body || "",
      })),
      focusPanels: [],
      lanes: [],
    };
    // ── Verge → Advocacy ────────────────────────────────────────────────────
    case "stat-hero": return {
      ...topic, layout: "adv-stats",
      thesis: topic.subtitle,
      cards: arr(topic.statCards).map((c) => ({
        title: c.label || "", body: c.body || "",
        step: c.value || "", eyebrow: "", marker: "○",
      })),
    };
    case "quote-collage": return {
      ...topic, layout: "adv-future",
      callout: arr(topic.quotes)[0]?.text || "",
      cards: arr(topic.quotes).slice(1).map((q) => ({ title: q.text, body: q.attr || "" })),
    };
    case "badge-grid": return {
      ...topic, layout: "adv-overview",
      heroPoints: arr(topic.badges).map((b) => b.label || b.name || ""),
      cards: arr(topic.badges).map((b) => ({ title: b.label || b.name || "", body: b.meta || "" })),
    };
    case "data-table": return {
      ...topic, layout: "adv-stats",
      thesis: topic.tableTitle || "",
      cards: arr<unknown[]>(topic.tableRows).map((r) => ({
        title: (r[0] as string) || "", body: ((r.slice?.(1) || []) as unknown[]).join(" · "),
        step: "", eyebrow: "", marker: "○",
      })),
    };
    case "bar-chart": return {
      ...topic, layout: "adv-stats",
      thesis: topic.subtitle,
      cards: arr(topic.barGroups).map((g) => ({
        title: g.label || "",
        body: arr(g.bars).map((b) => `${b.label}: ${b.value}`).join(", "),
        step: "", eyebrow: "", marker: "○",
      })),
    };
    case "color-blocks": return {
      ...topic, layout: "adv-overview",
      heroPoints: [],
      cards: arr(topic.blocks).map((b) => ({ title: b.label || "", body: b.body || "" })),
    };
    // ── Engineering → Advocacy ──────────────────────────────────────────────
    case "eng-architecture": return {
      ...topic, layout: "adv-stats",
      thesis: topic.subheadline || topic.subtitle,
      cards: arr(topic.cards).map((c) => ({
        title: c.title, body: c.body || "",
        step: c.stat || "", eyebrow: c.statLabel || "", marker: "○",
      })),
    };
    case "eng-code-flow": return {
      ...topic, layout: "adv-hurdles",
      cards: arr(topic.cards).map((c) => ({
        title: c.title, challenge: c.body || "", fix: "",
      })),
    };
    case "eng-tech-stack": return {
      ...topic, layout: "adv-stats",
      thesis: topic.subheadline || topic.subtitle,
      cards: arr(topic.cards).map((c) => ({
        title: c.title, body: c.body || "",
        step: c.stat || "", eyebrow: c.statLabel || "", marker: "○",
      })),
    };
    case "eng-roadmap": return {
      ...topic, layout: "adv-future",
      callout: topic.callout || "",
      cards: arr(topic.cards).map((c) => ({ title: c.title, body: c.body || "" })),
    };
    // ── Ops → Advocacy ──────────────────────────────────────────────────────
    case "op-brief": return {
      ...topic, layout: "adv-stats",
      thesis: topic.headline,
      cards: arr(topic.cards).map((c) => ({
        title: c.title, body: c.body || "",
        step: c.stat || "", eyebrow: c.statLabel || "", marker: "○",
      })),
    };
    case "op-flow": return {
      ...topic, layout: "adv-hurdles",
      cards: arr(topic.steps ?? topic.cards).map((s) => ({
        title: s.title || "", challenge: s.body || "", fix: s.tip || "",
      })),
    };
    default: return topic;
  }
}
