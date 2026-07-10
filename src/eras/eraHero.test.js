import { getEraHero } from "./eraHero";

describe("eraHero", () => {
  it("has a tagline and a non-empty writeup for each past era", () => {
    ["y2001", "y2007", "y2014", "y2020"].forEach((id) => {
      const hero = getEraHero(id);
      expect(hero).toBeTruthy();
      expect(hero.tagline).toBeTruthy();
      expect(hero.writeup.length).toBeGreaterThan(0);
      hero.writeup.forEach((p) => expect(typeof p).toBe("string"));
    });
  });

  it("gives every era a distinct tagline and greeting", () => {
    const ids = ["y2001", "y2007", "y2014", "y2020"];
    const taglines = ids.map((id) => getEraHero(id).tagline);
    const firstLines = ids.map((id) => getEraHero(id).writeup[0]);
    expect(new Set(taglines).size).toBe(4);
    expect(new Set(firstLines).size).toBe(4);
  });

  it("returns null for the present (uses the live bio)", () => {
    expect(getEraHero("present")).toBeNull();
    expect(getEraHero("nope")).toBeNull();
  });
});
