import { layoutRegistry } from "../registry.ts";
import { HbChapterLayout } from "./HbChapterLayout.tsx";
import { HbPracticesLayout } from "./HbPracticesLayout.tsx";
import { HbProcessLayout } from "./HbProcessLayout.tsx";
import { HbManifestoLayout } from "./HbManifestoLayout.tsx";
import { HbIndexLayout } from "./HbIndexLayout.tsx";

/** Handbook: transcription target — effects only (each carries its own icon). */
const HB_FEATURES = { effects: true };

layoutRegistry.register("hb-chapter", HbChapterLayout, { ...HB_FEATURES, icon: "📖" });
layoutRegistry.register("hb-practices", HbPracticesLayout, { ...HB_FEATURES, icon: "📝" });
layoutRegistry.register("hb-process", HbProcessLayout, { ...HB_FEATURES, icon: "🔄" });
layoutRegistry.register("hb-manifesto", HbManifestoLayout, { ...HB_FEATURES, icon: "📜" });
layoutRegistry.register("hb-index", HbIndexLayout, { ...HB_FEATURES, icon: "📇" });
