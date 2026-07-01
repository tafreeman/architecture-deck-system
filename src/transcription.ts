/**
 * transcription.ts — Cross-family layout normalisation.
 *
 * Originally extracted from App.v14.tsx as a single 683-line file with 5
 * near-duplicate switch functions. DECK-4 split the per-family logic into
 * src/transcription/*.ts modules (one file per target family, each <200
 * lines); this file is now a thin re-export shell that keeps the public API
 * (transcribeTopic + layout set constants + Topic type) stable for existing
 * consumers. Pure extraction — no logic changes; behavior is pinned by the
 * characterization matrix in transcription.test.ts.
 *
 * Public API: transcribeTopic + layout set constants + Topic type.
 */

import { transcribeToAdvocacy } from "./transcription/to-advocacy.ts";
import { transcribeToAdvocacyDense } from "./transcription/to-advocacy-dense.ts";
import { transcribeToBase } from "./transcription/to-base.ts";
import { transcribeToHandbook } from "./transcription/to-handbook.ts";
import { transcribeToVerge } from "./transcription/to-verge.ts";
import {
  ADV_LAYOUTS,
  ADVD_LAYOUTS,
  BASE_LAYOUTS,
  HANDBOOK_LAYOUTS,
  VERGE_LAYOUTS,
  type Topic,
} from "./transcription/types.ts";

export type { Topic };
export { ADV_LAYOUTS, ADVD_LAYOUTS, BASE_LAYOUTS, HANDBOOK_LAYOUTS, VERGE_LAYOUTS };

export function transcribeTopic(topic: Topic, targetFamily: string): Topic {
  if (targetFamily === "base" && !BASE_LAYOUTS.has(topic.layout)) return transcribeToBase(topic);
  if (targetFamily === "verge" && !VERGE_LAYOUTS.has(topic.layout)) return transcribeToVerge(topic);
  if (targetFamily === "handbook" && !HANDBOOK_LAYOUTS.has(topic.layout)) return transcribeToHandbook(topic);
  if (targetFamily === "advocacy" && !ADV_LAYOUTS.has(topic.layout)) return transcribeToAdvocacy(topic);
  if (targetFamily === "advocacy-dense" && !ADVD_LAYOUTS.has(topic.layout)) return transcribeToAdvocacyDense(topic);
  return topic;
}
