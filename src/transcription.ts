/**
 * transcription.ts — Cross-family layout normalisation.
 *
 * Extracted from App.v14.tsx. Pure extraction — no logic changes.
 * Public API: transcribeTopic + layout set constants.
 */

export type Topic = Record<string, unknown> & { layout: string };

/** Loose shape for the heterogeneous card/step/item objects topics carry. */
interface SlideItem {
  title?: string; body?: string; stat?: string; statLabel?: string; step?: string;
  eyebrow?: string; icon?: string; label?: string; name?: string; desc?: string;
  value?: string | number; meta?: string; num?: string; type?: string; tip?: string;
  val?: string; sub?: string; text?: string; attr?: string; challenge?: string;
  fix?: string; persona?: string; subtitle?: string; banner?: string;
  items?: unknown[]; bars?: SlideItem[]; cards?: SlideItem[]; steps?: SlideItem[];
  [key: string]: unknown;
}

/** Coerce an unknown field to a typed array (non-arrays -> []). */
const arr = <T = SlideItem>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// ── Layout set constants ───────────────────────────────────────────────────

export const BASE_LAYOUTS = new Set(["two-col","stat-cards","before-after","process-cycle","h-strip","process-lanes"]);
export const VERGE_LAYOUTS = new Set(["stat-hero","quote-collage","badge-grid","data-table","bar-chart","color-blocks"]);
export const HANDBOOK_LAYOUTS = new Set(["hb-chapter","hb-practices","hb-process","hb-manifesto","hb-index"]);
export const ADV_LAYOUTS = new Set(["adv-overview","adv-stats","adv-hurdles","adv-future","adv-platform"]);
export const ADVD_LAYOUTS = new Set(["advd-overview","advd-stats","advd-hurdles","advd-future","advd-platform"]);

// ── Transcription functions ────────────────────────────────────────────────

function transcribeToBase(topic: Topic): Topic {
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

function transcribeToVerge(topic: Topic): Topic {
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
      blocks: arr(topic.pillars).map((p) => ({ label: p.title, value: p.icon||"", body: arr<unknown>(p.items).slice(0,2).join(" · ") })),
    };
    case "catalog": return {
      ...topic, layout: "color-blocks",
      blocks: arr(topic.categories).map((c) => ({ label: c.title, value: arr<unknown>(c.items).length||0, body: arr<SlideItem | string>(c.items).slice(0,3).map((i)=>(typeof i === "string" ? i : (i.label||i))).join(" · ") })),
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

function transcribeToHandbook(topic: Topic): Topic {
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

function transcribeToAdvocacy(topic: Topic): Topic {
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
        icon: p.icon || "●", title: i, body: "",
      }))),
      focusPanels: arr(topic.results).map((r) => ({ label: r.val, title: r.label, body: "" })),
    };
    case "catalog": return {
      ...topic, layout: "adv-future",
      cards: arr(topic.categories).slice(0, 4).map((c) => ({
        title: c.title,
        body: arr<SlideItem | string>(c.items).slice(0, 3).map((i) => (typeof i === "string" ? i : (i.label || i))).join(" · "),
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

function transcribeToAdvocacyDense(topic: Topic): Topic {
  const base = transcribeToAdvocacy(topic);
  return { ...base, layout: base.layout.replace("adv-", "advd-") };
}

export function transcribeTopic(topic: Topic, targetFamily: string): Topic {
  if (targetFamily === "base" && !BASE_LAYOUTS.has(topic.layout)) return transcribeToBase(topic);
  if (targetFamily === "verge" && !VERGE_LAYOUTS.has(topic.layout)) return transcribeToVerge(topic);
  if (targetFamily === "handbook" && !HANDBOOK_LAYOUTS.has(topic.layout)) return transcribeToHandbook(topic);
  if (targetFamily === "advocacy" && !ADV_LAYOUTS.has(topic.layout)) return transcribeToAdvocacy(topic);
  if (targetFamily === "advocacy-dense" && !ADVD_LAYOUTS.has(topic.layout)) return transcribeToAdvocacyDense(topic);
  return topic;
}
