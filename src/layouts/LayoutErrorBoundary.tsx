/**
 * LayoutErrorBoundary — real React error boundary around a rendered layout.
 *
 * `LayoutRenderer`'s `layoutRegistry.has()` check only guards against an
 * *unknown layout ID* (a lookup miss before anything renders). It cannot
 * catch an exception thrown while a *registered* layout component actually
 * renders — e.g. a layout that assumes a field is present and a particular
 * slide's content is missing it. A function-component try/catch can't catch
 * a child's render error either (this repo's `react-hooks/error-boundaries`
 * lint rule enforces that). A real class-based boundary
 * (`getDerivedStateFromError` + `componentDidCatch`) is the only mechanism
 * React provides for this — which is why this is the one class component in
 * the codebase.
 *
 * The caller (`LayoutRenderer`) keys this component by the resolved layout id
 * + slide id, so navigating to a different slide (or cycling to a different
 * layout for the same slide) remounts the boundary and clears any
 * previously-caught error — a broken slide never gets "stuck" for the rest
 * of the session.
 */

import React from 'react';

interface LayoutErrorBoundaryProps {
  /** The layout id being rendered — shown in the fallback and logged. */
  layout: string;
  children: React.ReactNode;
}

interface LayoutErrorBoundaryState {
  error: Error | null;
}

export class LayoutErrorBoundary extends React.Component<
  LayoutErrorBoundaryProps,
  LayoutErrorBoundaryState
> {
  constructor(props: LayoutErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): LayoutErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      `[LayoutErrorBoundary] layout "${this.props.layout}" threw while rendering:`,
      error,
      info.componentStack,
    );
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (error) {
      return (
        <div
          role="alert"
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
          <strong>Layout Render Error: &quot;{this.props.layout}&quot;</strong>
          <p style={{ marginTop: 8, opacity: 0.8 }}>
            This slide failed to render ({error.message || 'unknown error'}).
            Other slides are unaffected — pick a different one from the DECK panel.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default LayoutErrorBoundary;
