/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import ArcadeApp from "./ArcadeApp";
import { getGameById, games } from "./games/gameRegistry";

// The picker and canvas render <canvas>/game loops that jsdom can't run, so
// stub them down to the routing-relevant surface.
jest.mock("./components/GamePicker", () => ({
  __esModule: true,
  default: ({ onSelectGame }) => (
    <div data-testid="picker">
      <button onClick={() => onSelectGame("tetris")}>play tetris</button>
    </div>
  ),
}));

jest.mock("./components/GameCanvas", () => ({
  __esModule: true,
  default: ({ game, onExit }) => (
    <div data-testid="canvas">
      <span data-testid="game-name">{game.name}</span>
      <button onClick={onExit}>exit</button>
    </div>
  ),
}));

const setHash = (hash) => {
  act(() => {
    window.history.pushState(null, "", hash ? `/#${hash}` : "/");
    window.dispatchEvent(new Event("hashchange"));
  });
};

describe("getGameById", () => {
  it("returns the matching game", () => {
    expect(getGameById("tetris")).toBe(games.find((g) => g.id === "tetris"));
  });

  it("returns null for unknown or empty ids", () => {
    expect(getGameById("does-not-exist")).toBeNull();
    expect(getGameById(null)).toBeNull();
  });
});

describe("ArcadeApp routing", () => {
  beforeEach(() => {
    window.history.pushState(null, "", "/");
  });

  it("shows the game picker when there is no hash", () => {
    render(<ArcadeApp />);

    expect(screen.getByTestId("picker")).toBeInTheDocument();
    expect(screen.queryByTestId("canvas")).not.toBeInTheDocument();
  });

  it("opens a game directly from the URL hash", () => {
    window.history.pushState(null, "", "/#snake");

    render(<ArcadeApp />);

    expect(screen.getByTestId("canvas")).toBeInTheDocument();
    expect(screen.getByTestId("game-name")).toHaveTextContent("Snake");
  });

  it("ignores an unknown hash and shows the picker", () => {
    window.history.pushState(null, "", "/#not-a-game");

    render(<ArcadeApp />);

    expect(screen.getByTestId("picker")).toBeInTheDocument();
  });

  it("writes the game id to the URL when a game is selected", () => {
    render(<ArcadeApp />);

    fireEvent.click(screen.getByText("play tetris"));

    expect(window.location.hash).toBe("#tetris");
    expect(screen.getByTestId("game-name")).toHaveTextContent("Tetris");
  });

  it("clears the hash when exiting a game", () => {
    window.history.pushState(null, "", "/#pong");
    render(<ArcadeApp />);

    fireEvent.click(screen.getByText("exit"));

    expect(window.location.hash).toBe("");
    expect(screen.getByTestId("picker")).toBeInTheDocument();
  });

  it("follows hash navigation (shared links / manual edits)", () => {
    render(<ArcadeApp />);
    expect(screen.getByTestId("picker")).toBeInTheDocument();

    setHash("breakout");

    expect(screen.getByTestId("game-name")).toHaveTextContent("Breakout");
  });

  it("follows back/forward navigation via popstate", () => {
    window.history.pushState(null, "", "/#tetris");
    render(<ArcadeApp />);
    expect(screen.getByTestId("canvas")).toBeInTheDocument();

    act(() => {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new Event("popstate"));
    });

    expect(screen.getByTestId("picker")).toBeInTheDocument();
  });
});
