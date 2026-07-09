/**
 * LayoutErrorBoundary.test.tsx — proves a throwing layout renders the
 * fallback, not a blank/white screen.
 *
 * Two layers:
 *   1. Direct unit tests of LayoutErrorBoundary in isolation (a deliberately
 *      throwing child stands in for "a broken layout component").
 *   2. Integration tests through the real LayoutRenderer, simulating a
 *      *registered* layout that throws during render — the failure mode the
 *      old `layoutRegistry.has()` existence check could never catch (that
 *      check only guards against an *unknown* layout id, not a render-time
 *      exception from a known one). `layoutRegistry.has`/`.get` are spied
 *      per-test and restored in `afterEach`, so the real singleton registry
 *      used by the rest of the suite is never mutated.
 */

import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { LayoutErrorBoundary } from "./LayoutErrorBoundary.tsx";
import { LayoutRenderer } from "./LayoutRenderer.tsx";
import { layoutRegistry } from "./registry.ts";

/** Deliberately-throwing stand-in for a broken layout component. */
function ThrowingLayout(): React.ReactElement {
  throw new Error("Simulated layout render crash");
}

/** Well-behaved stand-in layout — proves the happy path is untouched. */
function WorkingLayout({ topic }: { topic?: { title?: string } }): React.ReactElement {
  return <div data-testid="working-layout">{topic?.title ?? "untitled"}</div>;
}

describe("LayoutErrorBoundary — direct unit tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children normally when nothing throws", () => {
    render(
      <LayoutErrorBoundary layout="two-col">
        <div data-testid="ok">fine</div>
      </LayoutErrorBoundary>,
    );
    expect(screen.getByTestId("ok")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("catches a render error and shows a fallback instead of going blank", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <LayoutErrorBoundary layout="two-col">
        <ThrowingLayout />
      </LayoutErrorBoundary>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/two-col/);
    expect(alert).toHaveTextContent(/Simulated layout render crash/);
    // The document has real fallback content — never a blank/white screen.
    expect(document.body.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("LayoutRenderer — a throwing registered layout renders the fallback, not a blank screen", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const THROWING_LAYOUT_ID = "layout-error-boundary-test-throwing-layout";
  const WORKING_LAYOUT_ID = "layout-error-boundary-test-working-layout";

  it("shows the LayoutErrorBoundary fallback when the resolved layout component throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(layoutRegistry, "has").mockImplementation((id) => id === THROWING_LAYOUT_ID);
    vi.spyOn(layoutRegistry, "get").mockImplementation(() => ThrowingLayout);

    render(
      <LayoutRenderer
        layout={THROWING_LAYOUT_ID}
        slide={{ id: "broken-slide", title: "Broken" }}
        themeId="midnight-teal"
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(THROWING_LAYOUT_ID);
    // Never a blank screen: something is always on the page, even mid-crash.
    expect(document.body.textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("recovers on the next slide: a fresh LayoutRenderer render for a different slide is unaffected", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(layoutRegistry, "has").mockImplementation(
      (id) => id === THROWING_LAYOUT_ID || id === WORKING_LAYOUT_ID,
    );
    vi.spyOn(layoutRegistry, "get").mockImplementation((id) =>
      id === THROWING_LAYOUT_ID ? ThrowingLayout : WorkingLayout,
    );

    const { rerender } = render(
      <LayoutRenderer
        layout={THROWING_LAYOUT_ID}
        slide={{ id: "broken-slide", title: "Broken" }}
        themeId="midnight-teal"
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Simulate navigating to a different, healthy slide — same call site, new props.
    rerender(
      <LayoutRenderer
        layout={WORKING_LAYOUT_ID}
        slide={{ id: "healthy-slide", title: "All good" }}
        themeId="midnight-teal"
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("working-layout")).toHaveTextContent("All good");
  });
});
