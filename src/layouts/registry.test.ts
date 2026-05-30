import { describe, it, expect, vi } from "vitest";

import { LayoutRegistry, DEFAULT_FEATURES } from "./registry.ts";

/** Minimal stand-in layout components (the registry stores them opaquely). */
const Alpha = () => null;
const Beta = () => null;

describe("LayoutRegistry", () => {
  it("registers and retrieves a component by id", () => {
    const reg = new LayoutRegistry();
    reg.register("cover", Alpha);
    expect(reg.get("cover")).toBe(Alpha);
    expect(reg.has("cover")).toBe(true);
  });

  it("applies DEFAULT_FEATURES when none are provided", () => {
    const reg = new LayoutRegistry();
    reg.register("cover", Alpha);
    expect(reg.getFeatures("cover")).toEqual(DEFAULT_FEATURES);
  });

  it("merges feature overrides over the defaults", () => {
    const reg = new LayoutRegistry();
    reg.register("hero", Alpha, { effects: true });
    expect(reg.getFeatures("hero")).toEqual({
      ...DEFAULT_FEATURES,
      effects: true,
    });
  });

  it("returns DEFAULT_FEATURES (copy) for unknown ids", () => {
    const reg = new LayoutRegistry();
    expect(reg.getFeatures("missing")).toEqual(DEFAULT_FEATURES);
  });

  it("throws a helpful error when getting an unknown id", () => {
    const reg = new LayoutRegistry();
    reg.register("cover", Alpha);
    expect(() => reg.get("nope")).toThrow(/Unknown layout: "nope".*Available: cover/);
  });

  it("warns and overwrites on duplicate registration", () => {
    const reg = new LayoutRegistry();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    reg.register("cover", Alpha);
    reg.register("cover", Beta);
    expect(reg.get("cover")).toBe(Beta);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("registerBatch registers every entry with shared features", () => {
    const reg = new LayoutRegistry();
    reg.registerBatch({ a: Alpha, b: Beta }, { background: true });
    expect(reg.list().sort()).toEqual(["a", "b"]);
    expect(reg.getFeatures("a").background).toBe(true);
    expect(reg.getFeatures("b").background).toBe(true);
  });

  it("listByPrefix filters registered ids by prefix", () => {
    const reg = new LayoutRegistry();
    reg.registerBatch({ "hb-intro": Alpha, "hb-end": Beta, "eng-map": Alpha });
    expect(reg.listByPrefix("hb-").sort()).toEqual(["hb-end", "hb-intro"]);
    expect(reg.listByPrefix("eng-")).toEqual(["eng-map"]);
  });
});
