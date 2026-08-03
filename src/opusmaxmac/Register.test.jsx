/**
 * @jest-environment jsdom
 */
import { render, screen, within, act } from '@testing-library/react';
import Register from './Register';
import { orbitsFor } from './graphics/orbits';
import { plateFor, plates } from './data/plates';
import { patchBanks } from '../data/patchBanks';

/*
 * The orbital elements come from the WHOLE catalogue and are looked up by bank,
 * exactly as the page does it — that is what makes a designation survive a
 * search, and several tests below depend on it.
 */
const BODIES = new Map(orbitsFor(patchBanks).map((body) => [body.bank.name, body]));
const bodyFor = (bank) => BODIES.get(bank.name);

const WIDE = '(min-width: 62rem)';

/** Answers `WIDE` with `wide` and everything else with `false`. */
const mockMatchMedia = (wide) => {
  window.matchMedia = jest.fn((query) => ({
    matches: query === WIDE ? wide : false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

/** Records the rows an observer was given and lets a test walk into one. */
const installIntersectionObserver = () => {
  let notify;
  const observed = [];
  global.IntersectionObserver = class {
    constructor(callback) {
      notify = callback;
    }

    observe(element) {
      observed.push(element);
    }

    unobserve() {}

    disconnect() {}
  };
  return {
    observed,
    read: (index) => act(() => notify([{ isIntersecting: true, target: observed[index] }])),
  };
};

const registerOf = (banks, query = '') =>
  render(<Register banks={banks} bodyFor={bodyFor} query={query} />);

/** The figure a register line prints, with its label taken off the front. */
const lineValue = (label) =>
  screen.getByText(label).parentElement.textContent.slice(label.length);

/** The row a bank's name sits on. */
const rowFor = (name) => screen.getByText(name).closest('li');

const bankNamed = (name) => patchBanks.find((bank) => bank.name === name);
const PHOTOGRAPHED = patchBanks.filter((bank) => plateFor(bank.name));

describe('Register', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    delete global.IntersectionObserver;
    jest.restoreAllMocks();
  });

  it('gives every bank in the catalogue one row', () => {
    mockMatchMedia(false);
    registerOf(patchBanks);

    expect(screen.getAllByRole('listitem')).toHaveLength(patchBanks.length);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(patchBanks.length);
  });

  it('prints each bank with its description and its patch count', () => {
    mockMatchMedia(false);
    registerOf(patchBanks);

    patchBanks.forEach((bank) => {
      const row = rowFor(bank.name);
      expect(row).toHaveTextContent(bank.description);
      expect(row).toHaveTextContent(bank.count ? `${bank.count} patches` : 'MIDI files');
    });
  });

  it('says which bank each download link is for', () => {
    // Eleven links all announced as "Download" would leave a screen-reader user
    // with a list of identical actions and no way to tell them apart.
    mockMatchMedia(false);
    registerOf(patchBanks);

    patchBanks.forEach((bank) => {
      const download = screen.getByRole('link', { name: `Download the ${bank.name} bank` });
      expect(download).toHaveAttribute('href', bank.downloadLink);
    });
  });

  it('points each download at that bank and no other', () => {
    mockMatchMedia(false);
    registerOf(patchBanks);

    const hrefs = screen
      .getAllByRole('link', { name: /^Download the / })
      .map((link) => link.getAttribute('href'));

    expect(hrefs).toEqual(patchBanks.map((bank) => bank.downloadLink));
    expect(new Set(hrefs).size).toBe(patchBanks.length);
  });

  it('says "MIDI files" for the entry that has no patch count', () => {
    mockMatchMedia(false);
    registerOf([bankNamed('Audio Demo MIDIs')]);

    const row = rowFor('Audio Demo MIDIs');
    expect(row).toHaveTextContent('MIDI files');
    // A legend never states a figure the data does not hold, so there is no
    // count of patches on this row to be invented.
    expect(row).not.toHaveTextContent(/\d+ patches/);
  });

  it('reports the missing count on the bench too, rather than a magnitude', () => {
    mockMatchMedia(true);
    registerOf([bankNamed('Audio Demo MIDIs')]);

    expect(lineValue('Patches')).toBe('MIDI files');
    expect(lineValue('Magnitude')).toBe('Unlisted');
  });

  it('tells the reader when a bank has no demo instead of stopping', () => {
    mockMatchMedia(false);
    registerOf(patchBanks);

    const silent = patchBanks.filter((bank) => (bank.audioDemo || []).length === 0);
    expect(screen.getAllByText('No demo on file')).toHaveLength(silent.length);

    silent.forEach((bank) => {
      expect(rowFor(bank.name)).toHaveTextContent('No demo on file');
    });
  });

  it('offers a cue for every demo a bank does have', () => {
    mockMatchMedia(false);
    registerOf(patchBanks);

    const prophet = bankNamed('Sequential Prophet 08 and Rev2');
    const row = rowFor(prophet.name);
    expect(within(row).getByRole('button', { name: `Hear ${prophet.name}, demo 1 of 2` }))
      .toBeInTheDocument();
    expect(within(row).getByRole('button', { name: `Hear ${prophet.name}, demo 2 of 2` }))
      .toBeInTheDocument();
  });

  it('keeps a bank on its own designation when the register is filtered', () => {
    // The whole reason the elements are computed from the full catalogue: the
    // Moog bank is the seventh entry, and typing in the finder must not promote
    // it to the first. A designation that moves is not a designation.
    mockMatchMedia(false);
    const filtered = patchBanks.filter((bank) => bank.name.includes('Phatty'));
    expect(filtered).toHaveLength(1);

    registerOf(filtered, 'Phatty');

    expect(screen.getByText('VII')).toBeInTheDocument();
    expect(screen.queryByText('I')).not.toBeInTheDocument();
  });

  it('keeps a filtered bank on its own interval as well', () => {
    mockMatchMedia(true);
    registerOf(patchBanks.filter((bank) => bank.name.includes('Phatty')), 'Phatty');

    expect(lineValue('Designation')).toBe('VII');
    expect(lineValue('Interval')).toBe('3:2 · 702¢');
  });

  it('names the query and suggests what to type when nothing matches', () => {
    mockMatchMedia(true);
    registerOf([], 'oboe');

    const state = screen.getByText(/nothing in the register matches/i);
    expect(state).toHaveTextContent('oboe');
    expect(state).toHaveTextContent('Nord, Virus, Prophet, Moog, JP-8000');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.queryByText('Designation')).not.toBeInTheDocument();
  });

  it('puts one instrument on the bench beside the register on a wide layout', () => {
    mockMatchMedia(true);
    registerOf(patchBanks);

    // One photograph on the page, not eleven — the point of the bench.
    const photographs = screen.getAllByRole('img');
    expect(photographs).toHaveLength(1);
    expect(photographs[0]).toHaveAccessibleName(plates[patchBanks[0].name].alt);

    expect(lineValue('Designation')).toBe('I');
    expect(lineValue('Patches')).toBe('128');
  });

  it('gives each row its own figure when there is no room for a bench', () => {
    mockMatchMedia(false);
    registerOf(patchBanks);

    // The swap is made in JavaScript rather than CSS because a display:none
    // <img> is still an <img> the browser goes and fetches.
    expect(screen.getAllByRole('img')).toHaveLength(PHOTOGRAPHED.length);
    expect(screen.queryByText('Designation')).not.toBeInTheDocument();
  });

  it('shows the bench the row the reader has scrolled to', () => {
    mockMatchMedia(true);
    const observer = installIntersectionObserver();
    registerOf(patchBanks);

    observer.read(6);

    expect(lineValue('Designation')).toBe('VII');
    expect(screen.getByRole('img'))
      .toHaveAccessibleName(plates['Moog Slim Phatty and Little Phatty'].alt);
  });

  it('keeps the first instrument on the bench where there is no observer to ask', () => {
    // jsdom has no IntersectionObserver, and neither do very old browsers. The
    // page that falls out is a static one with one photograph, not a broken one.
    mockMatchMedia(true);
    registerOf(patchBanks);

    expect(lineValue('Designation')).toBe('I');
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });
});
