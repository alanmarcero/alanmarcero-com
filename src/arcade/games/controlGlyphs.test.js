import { controlGlyphs } from "./controlGlyphs";
import { games } from "./gameRegistry";

describe("controlGlyphs", () => {
  it("maps arrow keys and Space to glyphs", () => {
    expect(
      controlGlyphs({ keyboard: { left: "ArrowLeft", right: "ArrowRight", fire: "Space" } })
    ).toEqual(["←", "→", "SPACE"]);
  });

  it("de-duplicates repeated keys while preserving order", () => {
    expect(
      controlGlyphs({ keyboard: { a: "ArrowUp", b: "ArrowUp", c: "ArrowDown" } })
    ).toEqual(["↑", "↓"]);
  });

  it("upper-cases other single keys", () => {
    expect(controlGlyphs({ keyboard: { secondary: "x" } })).toEqual(["X"]);
  });

  it("returns an empty array for missing controls", () => {
    expect(controlGlyphs()).toEqual([]);
    expect(controlGlyphs({})).toEqual([]);
  });

  it("produces a non-empty glyph list for every registered game", () => {
    games.forEach((game) => {
      expect(controlGlyphs(game.controls).length).toBeGreaterThan(0);
    });
  });
});
