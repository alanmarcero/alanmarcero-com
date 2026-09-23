/**
 * @jest-environment jsdom
 */
import { render, screen, within, fireEvent } from '@testing-library/react';
import CodexApp from './CodexApp';
import { patchBanks } from '../../../src/data/patchBanks';

const PLAYLIST = [
  { title: 'Alan-M - Famicom', videoId: 'aaaaaaaaaaa', description: '' },
  { title: 'Sean Tyas - Melbourne (Alan-M Remix)', videoId: 'bbbbbbbbbbb', description: '' },
];

const resolveWith = (items) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ items }) }));
};

const failWith = (message) => {
  global.fetch = jest.fn(() => Promise.reject(new Error(message)));
};

const bankRegion = () => screen.getByRole('region', { name: 'Patch banks' });
const releaseRegion = () => screen.getByRole('region', { name: 'Music and remixes' });
const finder = () => screen.getByLabelText('Find an instrument or a track');
const type = (value) => fireEvent.change(finder(), { target: { value } });

beforeEach(() => {
  // jsdom has no 2d context; answering null is what the footer meter expects there.
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  window.matchMedia = jest.fn(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('CodexApp', () => {
  it('lists every bank, then the releases once they arrive', async () => {
    resolveWith(PLAYLIST);
    render(<CodexApp />);

    const rows = within(bankRegion()).getAllByRole('heading', { level: 3 });
    expect(rows).toHaveLength(patchBanks.length);
    expect(await within(releaseRegion()).findByText('Alan-M - Famicom')).toBeInTheDocument();
    expect(within(releaseRegion()).getByText('01')).toBeInTheDocument();
  });

  it('labels every demo with its visible cue first', async () => {
    resolveWith([]);
    render(<CodexApp />);
    await screen.findByText('No releases are listed just now.');

    const cues = within(bankRegion()).getAllByRole('button', { name: /^(Hear it|Demo \d+)/ });
    expect(cues.length).toBeGreaterThan(0);
    cues.forEach((button) => {
      expect(button.getAttribute('aria-label').startsWith(button.textContent.trim())).toBe(true);
    });
  });

  it('narrows both sections and reports the counts', async () => {
    resolveWith(PLAYLIST);
    render(<CodexApp />);
    await within(releaseRegion()).findByText('Alan-M - Famicom');

    type('melbourne');
    expect(within(releaseRegion()).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('status', { name: '' }).textContent).toBe('0 banks · 1 release');
    expect(within(bankRegion()).getByText(/Nothing in the catalogue matches/)).toBeInTheDocument();
  });

  it('shows the empty state when nothing anywhere matches, and clears it', async () => {
    resolveWith(PLAYLIST);
    render(<CodexApp />);
    await within(releaseRegion()).findByText('Alan-M - Famicom');

    type('zzzz-nothing');
    expect(screen.queryByRole('region', { name: 'Patch banks' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(finder().value).toBe('');
    expect(bankRegion()).toBeInTheDocument();
  });

  it('clears the search on Escape and focuses the finder on "/"', async () => {
    resolveWith(PLAYLIST);
    render(<CodexApp />);
    await within(releaseRegion()).findByText('Alan-M - Famicom');

    type('nord');
    fireEvent.keyDown(finder(), { key: 'Escape' });
    expect(finder().value).toBe('');

    finder().blur();
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(finder());
  });

  it('says so when the releases fail, and leaves the banks in place', async () => {
    failWith('offline');
    render(<CodexApp />);

    expect(await within(releaseRegion()).findByText(/did not load/)).toBeInTheDocument();
    expect(within(bankRegion()).getAllByRole('heading', { level: 3 })).toHaveLength(patchBanks.length);
  });

  it('credits each photograph the page shows', () => {
    resolveWith([]);
    render(<CodexApp />);
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(/Images · \d+ instruments/)).toBeInTheDocument();
  });
});
