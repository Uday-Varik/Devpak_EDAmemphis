import { describe, it, expect } from "vitest";
import { cleanAddressPart, composeAddress } from "../address";

describe("cleanAddressPart", () => {
  it("strips a pasted field label", () => {
    expect(cleanAddressPart("Street Address: 1847 Rozelle St")).toBe("1847 Rozelle St");
    expect(cleanAddressPart("City - Memphis")).toBe("Memphis");
    expect(cleanAddressPart("Zip Code: 38104")).toBe("38104");
  });

  it("strips repeated labels", () => {
    expect(cleanAddressPart("Address: Street Address: 123 Main")).toBe("123 Main");
  });

  it("leaves values without a label-plus-separator untouched", () => {
    expect(cleanAddressPart("Address 12 Main")).toBe("Address 12 Main");
    expect(cleanAddressPart("123 Main St")).toBe("123 Main St");
  });

  it("trims whitespace and maps nullish input to an empty string", () => {
    expect(cleanAddressPart("   Memphis  ")).toBe("Memphis");
    expect(cleanAddressPart(null)).toBe("");
    expect(cleanAddressPart(undefined)).toBe("");
  });
});

describe("composeAddress", () => {
  it("joins cleaned parts with commas and drops empty ones", () => {
    expect(composeAddress("Street Address: 1847 Rozelle St", "City: Memphis", "TN", "", null)).toBe(
      "1847 Rozelle St, Memphis, TN"
    );
  });

  it("returns an empty string when every part is empty", () => {
    expect(composeAddress("", undefined, "  ")).toBe("");
  });
});
