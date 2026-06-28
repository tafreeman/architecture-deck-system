import { layoutRegistry } from "../registry.ts";
import { SprintLayout } from "./SprintLayout.tsx";

/** Sprint: specialized process view — effects only. */
layoutRegistry.register("process-cycle", SprintLayout, { effects: true, icon: "⟳" });

/**
 * Per-node glyphs for the sprint-cycle layout, keyed by node `abbr`.
 *
 * Lives alongside the sprint layout registration (its sole consumer at deck-
 * build time) rather than in App.tsx, so the sprint family owns its own icon
 * vocabulary. Used by `normalizeSprintNodes` to backfill a node's `icon`.
 */
export const SPRINT_NODE_ICONS: Record<string, string> = {
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
