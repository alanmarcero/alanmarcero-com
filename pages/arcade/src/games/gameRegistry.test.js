import { games, getGameById, pickRandomGameId } from "./gameRegistry";

describe("getGameById", () => {
  it("returns the matching game", () => {
    expect(getGameById("tetris")).toBe(games.find((g) => g.id === "tetris"));
  });

  it("returns null for unknown or empty ids", () => {
    expect(getGameById("nope")).toBeNull();
    expect(getGameById(null)).toBeNull();
  });
});

describe("pickRandomGameId", () => {
  it("returns the first game when rng is 0", () => {
    expect(pickRandomGameId(() => 0)).toBe(games[0].id);
  });

  it("returns the last game when rng approaches 1", () => {
    expect(pickRandomGameId(() => 0.999)).toBe(games[games.length - 1].id);
  });

  it("always returns a valid game id", () => {
    for (const r of [0, 0.25, 0.5, 0.75, 0.99]) {
      expect(getGameById(pickRandomGameId(() => r))).not.toBeNull();
    }
  });
});
