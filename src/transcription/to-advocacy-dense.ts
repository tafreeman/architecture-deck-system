/**
 * transcription/to-advocacy-dense.ts — Transcribe any supported source
 * layout to the "advocacy-dense" family (advd-overview, advd-stats,
 * advd-hurdles, advd-future, advd-platform).
 *
 * Delegates to transcribeToAdvocacy and rewrites the resulting "adv-"
 * layout prefix to "advd-". Extracted from transcription.ts (DECK-4). Pure
 * extraction — no logic changes; behavior is pinned by the characterization
 * matrix in transcription.test.ts.
 */

import { transcribeToAdvocacy } from "./to-advocacy.ts";
import type { Topic } from "./types.ts";

export function transcribeToAdvocacyDense(topic: Topic): Topic {
  const base = transcribeToAdvocacy(topic);
  return { ...base, layout: base.layout.replace("adv-", "advd-") };
}
