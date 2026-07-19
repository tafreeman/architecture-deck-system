/**
 * AppErrorBoundary.test.tsx — proves a render throw above the per-layout
 * boundary shows a user-facing fallback instead of a blank white screen.
 *
 * LayoutErrorBoundary only covers a single rendered layout; this top-level
 * boundary is the one that catches crashes in routing / deck selection /
 * top-level state. The test stands a deliberately-throwing component in for
 * "the whole app crashed during render".
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { AppErrorBoundary } from "./AppErrorBoundary.tsx";

/** Deliberately-throwing stand-in for a crashing top-level app. */
function ThrowingApp(): React.ReactElement {
  throw new Error("Simulated top-level app crash");
}

describe("AppErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children normally when nothing throws", () => {
    render(
      <AppErrorBoundary>
        <div data-testid="app-ok">running</div>
      </AppErrorBoundary>,
    );
    expect(screen.getByTestId("app-ok")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a fallback instead of a blank screen when a top-level render throws", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <ThrowingApp />
      </AppErrorBoundary>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/Something went wrong/);
    // A reload hint is offered so the user has a way forward.
    expect(alert).toHaveTextContent(/Reload/);
    // The document has real fallback content — never a blank/white screen.
    expect(document.body.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    expect(errorSpy).toHaveBeenCalled();
  });
});
