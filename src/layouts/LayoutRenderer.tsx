/**
 * LayoutRenderer — registry-based slide renderer.
 *
 * Resolves a layout string to its registered component and renders it.
 * Wraps in an error boundary to gracefully handle unknown layouts.
 *
 * Prop forwarding notes:
 * - `topic` is passed to the layout component (matching the extracted component API)
 * - `stat-cards` routing: if the slide has manifest data fields, uses "stat-cards-manifest"
 * - All additional props (e.g. `onBack`, `nodes`) are forwarded via ...rest
 */

import React from 'react';
import { layoutRegistry } from './registry';

/** Fields that trigger the manifest variant of stat-cards. */
const MANIFEST_FIELDS = ['results', 'leadershipPoints', 'enablement', 'thesis'];

interface LayoutRendererProps {
  layout: string;
  slide: Record<string, unknown>;
  themeId: string;
  [key: string]: unknown;
}

/**
 * Resolve the registry key for a slide, handling multi-variant layouts.
 */
function resolveLayoutKey(layout: string, topic: Record<string, unknown>): string {
  if (layout === 'stat-cards') {
    const hasManifestData = MANIFEST_FIELDS.some((f) => topic[f] != null);
    return hasManifestData ? 'stat-cards-manifest' : 'stat-cards';
  }
  return layout;
}

/**
 * Render a slide using the layout registry.
 * Falls back to an error panel if the layout is unknown.
 */
export function LayoutRenderer({ layout, slide, themeId, ...rest }: LayoutRendererProps) {
  const resolvedKey = resolveLayoutKey(layout, slide);

  // Explicit existence check rather than try/catch around render: a try/catch
  // in a component body is not a real error boundary (it cannot catch a child's
  // render errors), and registry.get() only throws for unknown layouts — which
  // we detect directly here.
  if (!layoutRegistry.has(resolvedKey)) {
    return (
      <div
        style={{
          padding: 40,
          backgroundColor: 'rgba(255,0,0,0.08)',
          color: '#cc0000',
          fontFamily: 'monospace',
          fontSize: 14,
          borderRadius: 8,
          margin: 20,
        }}
      >
        <strong>Layout Error: &quot;{layout}&quot;</strong>
        <p style={{ marginTop: 8, opacity: 0.8 }}>Unknown layout: &quot;{resolvedKey}&quot;</p>
      </div>
    );
  }

  const Component = layoutRegistry.get(resolvedKey);
  // Pass `topic` to match the extracted component prop API (monolith pattern).
  // eslint-disable-next-line react-hooks/static-components -- dynamic dispatch: registry.get returns a stable, module-level component registered once at startup, not a component created during render
  return <Component topic={slide} themeId={themeId} {...rest} />;
}

export default LayoutRenderer;
