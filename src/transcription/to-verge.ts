/**
 * transcription/to-verge.ts — Transcribe any supported source layout to the
 * "verge" family (stat-hero, quote-collage, badge-grid, data-table,
 * bar-chart, color-blocks).
 *
 * Extracted from transcription.ts (DECK-4). Pure extraction — no logic
 * changes; behavior is pinned by the characterization matrix in
 * transcription.test.ts.
 */

import { arr, itemText, type SlideItem, type Topic } from "./types.ts";

export function transcribeToVerge(topic: Topic): Topic {
  switch (topic.layout) {
    case "info-cards": return {
      ...topic, layout: "stat-hero",
      heroTitle: topic.title,
      statCards: arr(topic.cards).map((c) => ({ value: c.stat, label: c.statLabel, body: c.body })),
    };
    case "checklist": return {
      ...topic, layout: "badge-grid",
      badges: [
        ...arr(topic.approved).map((i) => ({ icon: i.icon, label: i.title, meta: "Approved" })),
        ...arr(topic.forbidden).map((i) => ({ icon: i.icon, label: i.title, meta: "Prohibited" })),
      ],
    };
    case "workflow": return {
      ...topic, layout: "color-blocks",
      blocks: arr(topic.steps).map((s) => ({ label: `${s.num}. ${s.title}`, value: s.type?.toUpperCase(), body: s.body })),
    };
    case "pillars": return {
      ...topic, layout: "color-blocks",
      blocks: arr(topic.pillars).map((p) => ({ label: p.title, value: p.icon||"", body: arr<SlideItem | string>(p.items).slice(0,2).map(itemText).join(" · ") })),
    };
    case "catalog": return {
      ...topic, layout: "color-blocks",
      blocks: arr(topic.categories).map((c) => ({ label: c.title, value: arr<unknown>(c.items).length||0, body: arr<SlideItem | string>(c.items).slice(0,3).map(itemText).join(" · ") })),
    };
    case "hb-chapter": return {
      ...topic, layout: "color-blocks",
      blocks: arr(topic.chapters).map((c) => ({ label: c.title, value: c.num, body: c.sub })),
    };
    case "hb-practices": return {
      ...topic, layout: "color-blocks",
      blocks: arr(topic.practices).map((p, i: number) => ({ label: p.title, value: `0${i+1}`, body: p.body?.slice(0, 80) })),
    };
    case "hb-process": return {
      ...topic, layout: "color-blocks",
      blocks: arr(topic.steps).map((s) => ({ label: s.title, value: s.num, body: s.body })),
    };
    case "hb-manifesto": return {
      ...topic, layout: "quote-collage",
      quotes: arr<string>(topic.beliefs).map((b) => ({ text: b, attr: topic.eyebrow || "Studio" })),
    };
    case "hb-index": return {
      ...topic, layout: "badge-grid",
      badges: arr(topic.categories).map((c, i: number) => ({ icon: `0${i+1}`, label: c.label, meta: c.body?.split(" ").slice(0,5).join(" ") })),
    };
    // -- Base -> Verge
    case "two-col": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.cards).map((c) => ({ label: c.title, body: c.body||"", value: "" })),
    };
    case "stat-cards": return { ...topic, layout: "stat-hero",
      heroTitle: topic.title,
      statCards: arr(topic.cards).map((c) => ({ value: c.stat||"", label: c.statLabel||"", body: c.body||"" })),
    };
    case "before-after": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.cards).map((c) => ({ label: c.title, body: (c.challenge||"")+" -> "+(c.fix||""), value: "" })),
    };
    case "process-cycle": return { ...topic, layout: "color-blocks", blocks: [] };
    case "h-strip": return { ...topic, layout: "quote-collage",
      quotes: arr(topic.cards).map((c) => ({ text: c.title, attr: c.body||"" })),
    };
    case "process-lanes": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.lanes).map((l) => ({ label: l.title, value: l.persona||"", body: l.subtitle||"" })),
    };
    // -- Engineering -> Verge
    case "eng-architecture": return { ...topic, layout: "stat-hero",
      heroTitle: topic.title,
      statCards: arr(topic.cards).map((c) => ({ value: c.stat||"", label: c.title, body: c.body||"" })),
    };
    case "eng-code-flow": return { ...topic, layout: "badge-grid",
      badges: arr(topic.cards).map((c) => ({ icon: c.icon||"->", label: c.title, meta: c.body?.slice(0,40)||"" })),
    };
    case "eng-tech-stack": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.cards).map((c) => ({ label: c.title, value: c.stat||"", body: c.body||"" })),
    };
    case "eng-roadmap": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.cards).map((c) => ({ label: c.title, value: c.stat||"", body: c.body||"" })),
    };
    // -- Ops -> Verge
    case "op-brief": return { ...topic, layout: "stat-hero",
      heroTitle: topic.title,
      statCards: arr(topic.cards).map((c) => ({ value: c.stat||"", label: c.statLabel||"", body: c.body||"" })),
    };
    case "op-flow": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.steps ?? topic.cards).map((s) => ({ label: s.title||"", value: s.type||"", body: s.body||"" })),
    };
    // -- Advocacy -> Verge
    case "adv-overview": return { ...topic, layout: "badge-grid",
      badges: [...arr<string>(topic.heroPoints).map((p) => ({ icon: "O", label: p, meta: "" })), ...arr(topic.cards).map((c) => ({ icon: ".", label: c.title, meta: c.body?.slice(0,30)||"" }))],
    };
    case "adv-stats": return { ...topic, layout: "stat-hero",
      heroTitle: topic.title,
      statCards: arr(topic.cards).map((c) => ({ value: (c.step||c.stat)||"", label: (c.eyebrow||c.statLabel)||"", body: c.body||"" })),
    };
    case "adv-hurdles": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.cards).map((c) => ({ label: c.title, body: c.challenge||"", value: "" })),
    };
    case "adv-future": return { ...topic, layout: "quote-collage",
      quotes: [{ text: (topic.callout as string)||"", attr: topic.title }, ...arr(topic.cards).map((c) => ({ text: c.title, attr: c.body||"" }))],
    };
    case "adv-platform": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.capabilities).map((c) => ({ label: c.title, value: c.icon||"", body: c.body||"" })),
    };
    // -- Advocacy Dense -> Verge
    case "advd-overview": return { ...topic, layout: "badge-grid",
      badges: [...arr<string>(topic.heroPoints).map((p) => ({ icon: "O", label: p, meta: "" })), ...arr(topic.cards).map((c) => ({ icon: ".", label: c.title, meta: c.body?.slice(0,30)||"" }))],
    };
    case "advd-stats": return { ...topic, layout: "stat-hero",
      heroTitle: topic.title,
      statCards: arr(topic.cards).map((c) => ({ value: (c.step||c.stat)||"", label: (c.eyebrow||c.statLabel)||"", body: c.body||"" })),
    };
    case "advd-hurdles": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.cards).map((c) => ({ label: c.title, body: c.challenge||"", value: "" })),
    };
    case "advd-future": return { ...topic, layout: "quote-collage",
      quotes: [{ text: (topic.callout as string)||"", attr: topic.title }, ...arr(topic.cards).map((c) => ({ text: c.title, attr: c.body||"" }))],
    };
    case "advd-platform": return { ...topic, layout: "color-blocks",
      blocks: arr(topic.capabilities).map((c) => ({ label: c.title, value: c.icon||"", body: c.body||"" })),
    };
    default: return topic;
  }
}
