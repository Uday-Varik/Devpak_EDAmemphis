import { describe, it, expect, beforeEach, vi } from "vitest";

// Plain-function stub (not vi.fn): a vi.fn that throws synchronously leaks the error into the test run.
type Invoke = (name: string, opts: { body: unknown }) => unknown;
const stub = vi.hoisted(() => ({ invoke: ((() => undefined) as unknown) as Invoke }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: (name: string, opts: { body: unknown }) => stub.invoke(name, opts),
    },
  },
}));

import {
  fetchAttomComps,
  logFallbackLookup,
  validateCompInput,
  COMP_INPUT_ERROR,
} from "../attomAPI";

const input = { street: "123 Main St", city: "Memphis", state: "TN", zip: "38104", subjectSqft: 1800 };
const okSales = [{ address: "125 Main St", salePrice: 250000 }];

let calls: Array<[string, { body: unknown }]> = [];
const respondWith = (result: unknown) => {
  stub.invoke = async (name, opts) => {
    calls.push([name, opts]);
    return result;
  };
};

beforeEach(() => {
  calls = [];
});

describe("fetchAttomComps", () => {
  it("invokes the attom-comps function with the search input as the body", async () => {
    respondWith({ data: { source: "attom", sales: okSales, compsReturned: 4, compsAfterFiltering: 1 }, error: null });

    await fetchAttomComps(input);

    expect(calls).toEqual([["attom-comps", { body: input }]]);
  });

  it("returns the ATTOM result when it has sales", async () => {
    const data = { source: "attom", sales: okSales, compsReturned: 4, compsAfterFiltering: 1, estimate: 260000 };
    respondWith({ data, error: null });

    await expect(fetchAttomComps(input)).resolves.toEqual(data);
  });

  it("returns null (fallback signal) when the function reports fallback", async () => {
    respondWith({ data: { fallback: true, reason: "not_configured" }, error: null });
    await expect(fetchAttomComps(input)).resolves.toBeNull();
  });

  it("returns null when ATTOM returned no sales", async () => {
    respondWith({ data: { source: "attom", sales: [] }, error: null });
    await expect(fetchAttomComps(input)).resolves.toBeNull();
  });

  it("returns null on a function error rather than throwing (current behavior)", async () => {
    respondWith({ data: null, error: new Error("Edge function returned 429") });
    await expect(fetchAttomComps(input)).resolves.toBeNull();
  });

  it("returns null when invoke itself throws (current behavior)", async () => {
    stub.invoke = () => {
      throw new Error("network down");
    };
    const result = await fetchAttomComps(input);
    expect(result).toBeNull();
  });
});

describe("logFallbackLookup", () => {
  it("sends a mode=log body to attom-comps", async () => {
    respondWith({ data: { ok: true }, error: null });
    const payload = { street: "123 Main St", state: "TN", zip: "38104", found: true, compsReturned: 5, compsAfterFiltering: 2 };

    await logFallbackLookup(payload);

    expect(calls).toEqual([["attom-comps", { body: { mode: "log", ...payload } }]]);
  });

  it("swallows errors (instrumentation only)", async () => {
    stub.invoke = () => {
      throw new Error("boom");
    };
    await expect(
      logFallbackLookup({ street: "x", found: false, compsReturned: 0, compsAfterFiltering: 0 })
    ).resolves.toBeUndefined();
  });
});

describe("validateCompInput", () => {
  it("requires a street", () => {
    expect(validateCompInput({ street: "  ", zip: "38104" })).toBe(COMP_INPUT_ERROR);
  });

  it("requires a zip or state", () => {
    expect(validateCompInput({ street: "123 Main St" })).toBe(COMP_INPUT_ERROR);
  });

  it("accepts a street with a zip or a state", () => {
    expect(validateCompInput({ street: "123 Main St", zip: "38104" })).toBeNull();
    expect(validateCompInput({ street: "123 Main St", state: "TN" })).toBeNull();
  });
});
