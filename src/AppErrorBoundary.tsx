/**
 * AppErrorBoundary — top-level React error boundary around the whole <App/>.
 *
 * `LayoutErrorBoundary` only wraps an individual rendered layout, so it can
 * catch a crash *inside* a single slide but not one thrown above it — routing,
 * deck selection, or top-level state. Without a boundary here, any such render
 * exception unmounts React to a blank white screen with no way back. This
 * class boundary (the only mechanism React provides — a function-component
 * try/catch can't catch a child's render error) renders a user-facing fallback
 * instead, styled to match main.tsx's LoadingScreen so a mid-crash page still
 * looks like part of the app.
 */

import React from 'react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      '[AppErrorBoundary] the app crashed while rendering:',
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minHeight: '100dvh',
            background: '#0B1426',
            color: '#22D3EE',
            fontFamily: 'system-ui',
            textAlign: 'center',
            padding: 24,
          }}
        >
          <strong style={{ fontSize: 20 }}>Something went wrong.</strong>
          <p style={{ margin: 0, fontSize: 15, opacity: 0.8, maxWidth: 460 }}>
            The presentation hit an unexpected error ({error.message || 'unknown error'}).
            Reload the page to start over.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AppErrorBoundary;
