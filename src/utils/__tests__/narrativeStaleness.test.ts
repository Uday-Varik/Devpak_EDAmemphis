import { describe, it, expect } from "vitest";
import { buildFingerprint, isNarrativeStale } from "../narrativeStaleness";
import { buildOverviewFingerprint, buildRationaleFingerprint, type OverviewFingerprintInput } from "../narrativeFingerprints";

describe("buildFingerprint", () => {
  it("does not depend on key order", () => {
    expect(buildFingerprint({ a: 1, b: "x" })).toBe(buildFingerprint({ b: "x", a: 1 }));
  });

  it("rounds numbers to one decimal place", () => {
    expect(buildFingerprint({ n: 10.04 })).toBe(buildFingerprint({ n: 10 }));
    expect(buildFingerprint({ n: 10.06 })).not.toBe(buildFingerprint({ n: 10 }));
  });

  it("treats non-finite numbers as zero", () => {
    expect(buildFingerprint({ n: NaN })).toBe(buildFingerprint({ n: 0 }));
  });

  it("ignores case and surrounding whitespace in strings, and nullish values as empty", () => {
    expect(buildFingerprint({ s: "  Lender " })).toBe(buildFingerprint({ s: "lender" }));
    expect(buildFingerprint({ s: null })).toBe(buildFingerprint({ s: "" }));
  });
});

describe("isNarrativeStale", () => {
  it("is never stale when there is no text", () => {
    expect(isNarrativeStale("", "old", "new")).toBe(false);
    expect(isNarrativeStale(undefined, undefined, "new")).toBe(false);
  });

  it("is not stale when there is no current fingerprint to compare against", () => {
    expect(isNarrativeStale("Some text", "old", "")).toBe(false);
  });

  it("is stale when text was written before fingerprints existed", () => {
    expect(isNarrativeStale("Some text", undefined, "new")).toBe(true);
  });

  it("is stale only when the stored fingerprint differs from the live one", () => {
    expect(isNarrativeStale("Some text", "same", "same")).toBe(false);
    expect(isNarrativeStale("Some text", "old", "new")).toBe(true);
  });
});

describe("overview fingerprint", () => {
  const base: OverviewFingerprintInput = {
    address: "123 Main St",
    projectType: "new-construction",
    tdc: 250000,
    arv: 300000,
    netProfit: 30000,
    roi: 12,
    noi: 0,
    units: 4,
    sqftPlanned: 3600,
    exitStrategy: "sell",
    fundingGap: 0,
    packagePurpose: "lender",
  };
  const fp = (over: Partial<OverviewFingerprintInput>) => buildOverviewFingerprint({ ...base, ...over });

  it("is unchanged by sub-rounding noise in figures", () => {
    expect(fp({ tdc: 250000.04 })).toBe(fp({}));
  });

  it("changes when a material figure changes", () => {
    expect(fp({ tdc: 250000.5 })).not.toBe(fp({}));
    expect(fp({ units: 3 })).not.toBe(fp({}));
    expect(fp({ fundingGap: 1000 })).not.toBe(fp({}));
  });

  it("distinguishes a null ROI from a zero ROI", () => {
    expect(fp({ roi: null })).not.toBe(fp({ roi: 0 }));
  });

  it("ignores address case and whitespace", () => {
    expect(fp({ address: " 123 MAIN ST " })).toBe(fp({}));
  });
});

describe("rationale fingerprint", () => {
  const base = {
    decision: "go",
    roi: 12,
    netProfit: 30000,
    marginOfSafetyPercent: 8,
    dscr: 1.4,
    cashOnCash: 9,
    tdc: 250000,
  };

  it("goes stale when the decision or a figure changes", () => {
    const original = buildRationaleFingerprint(base);
    expect(buildRationaleFingerprint({ ...base, decision: "no-go" })).not.toBe(original);
    expect(buildRationaleFingerprint({ ...base, dscr: 1.1 })).not.toBe(original);
  });

  it("is stable when the same figures are supplied", () => {
    expect(buildRationaleFingerprint({ ...base })).toBe(buildRationaleFingerprint(base));
  });
});
