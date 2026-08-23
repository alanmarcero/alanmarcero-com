/**
 * @jest-environment jsdom
 */
import { render, screen, within, fireEvent } from '@testing-library/react';
import AlmanacApp from './AlmanacApp';
import { patchBanks } from '../../../src/data/patchBanks';
import { LAMBDA_URL } from '../../../src/config';

const PLAYLIST = [
  { title: 'Nordlight (Original Mix)', videoId: 'aaaaaaaaaaa' },
  { title: 'Kandi Floss (Alan-M Remix)', videoId: 'bbbbbbbbbbb' },
  { title: 'Essential Sunrise', videoId: 'ccccccccccc' },
  { title: 'Bonzai Nights', videoId: 'ddddddddddd' },
];

const PROPHET = 'Sequential Prophet 08 and Rev2';
const NORD_3 = 'Nord Lead 3 and Nord Rack 3';

const resolveWith = (items) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ items }) }));
};

const failWith = (message) => {
  global.fetch = jest.fn(() => Promise.reject(new Error(message)));
};

/** Answers a wide viewport with motion allowed. */
const mockMatchMedia = () => {
  window.matchMedia = jest.fn((query) => ({
    matches: query.includes('min-width'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

const installIntersectionObserver = () => {
  global.IntersectionObserver = class {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
};

const register = () => screen.getByRole('region', { name: 'Patch banks' });
const log = () => screen.getByRole('region', { name: 'Releases' });
const finder = () => screen.getByLabelText('Find an instrument or a track');
const type = (value) => fireEvent.change(finder(), { target: { value } });

/** Renders and waits for the playlist request to settle. */
const openPage = async () => {
  const result = render(<AlmanacApp />);
  await screen.findByText('releases');
  return result;
};

describe('AlmanacApp', () => {
  const originalMatchMedia = window.matchMedia;
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockMatchMedia();
    installIntersectionObserver();
    resolveWith(PLAYLIST);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    global.fetch = originalFetch;
    delete global.IntersectionObserver;
    jest.restoreAllMocks();
  });

  it('lays out the frontispiece, the register and the log', async () => {
    await openPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alan Marcero');
    expect(screen.getByRole('heading', { level: 2, name: 'Patch banks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Releases' })).toBeInTheDocument();
  });

  it('reads the log from the site’s own endpoint', async () => {
    await openPage();

    expect(global.fetch).toHaveBeenCalledWith(LAMBDA_URL, expect.anything());
    expect(within(log()).getByText('Bonzai Nights')).toBeInTheDocument();
  });

  it('prints the release figure once the request resolves', async () => {
    await openPage();

    expect(screen.getByText('releases').parentElement).toHaveTextContent('4');
  });

  it('narrows the register and the log together', async () => {
    await openPage();

    type('Nord');

    expect(within(register()).getByText(NORD_3)).toBeInTheDocument();
    expect(within(register()).queryByText(PROPHET)).not.toBeInTheDocument();

    expect(within(log()).getByText('Nordlight (Original Mix)')).toBeInTheDocument();
    expect(within(log()).queryByText('Bonzai Nights')).not.toBeInTheDocument();

    // Counted, and counted grammatically — "1 releases" is not a figure anyone
    // wants read back to them by a live region.
    expect(screen.getByText('2 banks · 1 release')).toBeInTheDocument();
  });

  it('puts both back when the finder is cleared', async () => {
    await openPage();

    type('Nord');
    expect(within(register()).queryByText(PROPHET)).not.toBeInTheDocument();

    type('');

    expect(within(register()).getByText(PROPHET)).toBeInTheDocument();
    expect(within(log()).getByText('Bonzai Nights')).toBeInTheDocument();
    expect(within(register()).getAllByRole('listitem')).toHaveLength(patchBanks.length);
  });

  it('leaves the frontispiece describing the whole work, not the search', async () => {
    await openPage();

    type('Nord');

    expect(screen.getByText('11').parentElement).toHaveTextContent('patch banks');
    expect(screen.getByText('releases').parentElement).toHaveTextContent('4');
  });

  it('shows both empty states when a query matches nothing', async () => {
    await openPage();

    type('oboe');

    expect(within(register()).getByText(/nothing in the register matches/i))
      .toHaveTextContent('oboe');
    expect(within(log()).getByText(/nothing in the log matches/i)).toHaveTextContent('oboe');
  });

  it('offers a skip link that lands somewhere focusable', async () => {
    await openPage();

    const skip = screen.getByRole('link', { name: /skip to the patch banks/i });
    expect(skip).toHaveAttribute('href', '#register');

    const target = document.getElementById('register');
    expect(target).toBe(register());

    // Without a tabindex the browser scrolls here and leaves focus on <body>,
    // so the next Tab goes back to the top of the page — the link looks right
    // and does nothing for the one reader it exists for.
    target.focus();
    expect(target).toHaveFocus();
  });

  it('still prints the register when the log cannot be fetched', async () => {
    // The patch banks are baked into the page and owe the network nothing.
    failWith('Request failed: 500');
    render(<AlmanacApp />);

    await screen.findByText(/could not be read/i);

    expect(within(register()).getAllByRole('listitem')).toHaveLength(patchBanks.length);
    expect(within(register()).getByText(PROPHET)).toBeInTheDocument();
  });

  it('claims no release figure at all when the log cannot be fetched', async () => {
    // Never "0 releases": the page was never told how many there are.
    failWith('Request failed: 500');
    render(<AlmanacApp />);

    await screen.findByText(/could not be read/i);

    expect(screen.queryByText('releases')).not.toBeInTheDocument();
    expect(screen.getByText('1,148').parentElement).toHaveTextContent('patches');
  });
});
