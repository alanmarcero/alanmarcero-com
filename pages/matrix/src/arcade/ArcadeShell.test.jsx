/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import ArcadeShell from './ArcadeShell';
import { games } from '../../../arcade/src/games/gameRegistry';

/*
 * The runtime renders a <canvas> and a game loop jsdom cannot run, so it is
 * stubbed down to the routing-relevant surface. Same shape as the stub in
 * src/arcade/ArcadeApp.test.jsx — deliberately, so the two read alike.
 *
 * The stub does NOT render game.name. That is the point: the real runtime
 * does not either, which is why GameView supplies the heading. A stub that
 * helpfully rendered the name would hide the defect this suite exists to pin.
 */
jest.mock('../../../arcade/src/components/GameCanvas', () => ({
  __esModule: true,
  default: ({ onExit }) => (
    <div data-testid="canvas">
      <button onClick={onExit}>ESC Exit</button>
    </div>
  ),
}));

/*
 * An independent spelling of the number words, written out rather than
 * imported from spellCount. Importing it would make the count assertion
 * below tautological — it would compare the function against itself and
 * pass for any consistent-but-wrong answer.
 */
const WORD_TO_COUNT = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20,
};

const setHash = (hash) => {
  act(() => {
    window.history.pushState(null, '', hash ? `/#${hash}` : '/');
    window.dispatchEvent(new Event('hashchange'));
  });
};

const launch = async (name) => {
  fireEvent.click(screen.getByRole('button', { name }));
  return screen.findByTestId('canvas');
};

beforeEach(() => setHash(null));

describe('the catalog', () => {
  it('titles the page Arcade, as its only h1', () => {
    render(<ArcadeShell />);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Arcade');
  });

  it('offers a launch button for every game in the registry', () => {
    render(<ArcadeShell />);
    games.forEach((game) => {
      expect(screen.getByRole('button', { name: game.name })).toBeTruthy();
    });
  });

  /*
   * The regression this slice was opened on. The lead read "Twelve arcade
   * machines" as a literal while the thing it counts is a registry in a file
   * this slice does not own. It was true when written; nothing would have
   * caught the day it stopped being.
   */
  it('states a machine count that agrees with the registry', () => {
    render(<ArcadeShell />);
    const lead = screen.getByText(/arcade machines/i);
    const spokenWord = lead.textContent.trim().split(/\s+/)[0].toLowerCase();
    const spokenCount = WORD_TO_COUNT[spokenWord] ?? Number(spokenWord);
    expect(spokenCount).toBe(games.length);
  });
});

describe('a running game', () => {
  const game = games[0];

  it('names the game in an h1, because the runtime names it nowhere', async () => {
    render(<ArcadeShell />);
    await launch(game.name);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(game.name);
  });

  it('does not repeat the exit control the runtime already renders', async () => {
    render(<ArcadeShell />);
    await launch(game.name);
    expect(screen.getAllByRole('button', { name: /exit/i })).toHaveLength(1);
  });

  it('returns to the catalog on exit, restoring the Arcade h1', async () => {
    render(<ArcadeShell />);
    await launch(game.name);
    fireEvent.click(screen.getByRole('button', { name: /exit/i }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Arcade');
  });

  it('starts from a deep link and ignores an unknown one', async () => {
    setHash(game.id);
    render(<ArcadeShell />);
    expect(await screen.findByTestId('canvas')).toBeTruthy();

    setHash('not-a-game');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Arcade');
  });
});

/*
 * Stated as its own case because it is the invariant, not a side effect of
 * the two states above: whichever state the shell is in, the document has
 * exactly one h1. Marquee was given the page's h1 because this route had
 * none, and that fix covered the catalog and not the state one click away.
 */
describe('the document outline', () => {
  it('has exactly one h1 in either state', async () => {
    render(<ArcadeShell />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await launch(games[0].name);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
