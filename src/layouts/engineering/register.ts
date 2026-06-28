/**
 * register.js — self-registration of engineering layouts into the global registry.
 */

import { layoutRegistry } from "../registry.ts";

import ArchitectureSlide from "./ArchitectureSlide.tsx";
import CodeFlowDiagram from "./CodeFlowDiagram.tsx";
import TechStackTimeline from "./TechStackTimeline.tsx";
import RoadmapMilestones from "./RoadmapMilestones.tsx";

/** Engineering: technical diagrams — clean rendering, no extra chrome. */
layoutRegistry.register("eng-architecture", ArchitectureSlide, { icon: "🏗️" });
layoutRegistry.register("eng-code-flow", CodeFlowDiagram, { icon: "🔗" });
layoutRegistry.register("eng-tech-stack", TechStackTimeline, { icon: "⚙️" });
layoutRegistry.register("eng-roadmap", RoadmapMilestones, { icon: "🗺️" });
