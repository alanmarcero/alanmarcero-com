import { isRemix } from "./trackMeta";

describe("isRemix", () => {
  it("detects a remix in parentheses", () => {
    expect(isRemix("Sean Tyas - Melbourne (Alan-M Remix)")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isRemix("Track (someone REMIX)")).toBe(true);
  });

  it("returns false for originals", () => {
    expect(isRemix("Alan-M - Famicom")).toBe(false);
    expect(isRemix("Remember Me")).toBe(false);
  });

  it("does not match substrings like 'remixer' boundaries loosely", () => {
    expect(isRemix("Premixed Dreams")).toBe(false);
  });

  it("handles missing input", () => {
    expect(isRemix()).toBe(false);
  });
});
