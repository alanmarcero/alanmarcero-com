/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Frontispiece from './Frontispiece';
import { orbitsFor } from './graphics/orbits';
import { patchBanks } from '../data/patchBanks';
import { YOUTUBE_CHANNEL_URL } from '../config';

const BODIES = orbitsFor(patchBanks);
const TOTAL_PATCHES = patchBanks.reduce((sum, bank) => sum + (bank.count || 0), 0);

/** Answers every media query with `false` unless the matcher says otherwise. */
const mockMatchMedia = (matcher = () => false) => {
  window.matchMedia = jest.fn((query) => ({
    matches: matcher(query),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

const prefersReducedMotion = (query) => query.includes('prefers-reduced-motion');

const cover = (overrides = {}) =>
  render(
    <Frontispiece
      banks={patchBanks}
      bodies={BODIES}
      totalPatches={TOTAL_PATCHES}
      releaseCount={null}
      {...overrides}
    />,
  );

/** The figure a register line prints, with its label taken off the front. */
const lineValue = (label) =>
  screen.getByText(label).parentElement.textContent.slice(label.length);

describe('Frontispiece', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockMatchMedia();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    jest.restoreAllMocks();
  });

  it('gives the page one first-level heading, and it is whose work this is', () => {
    cover();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Alan Marcero');
  });

  it('prints the patch total and the bank count each beside its unit', () => {
    cover();

    expect(screen.getByText('1,148').parentElement).toHaveTextContent('patches');
    expect(screen.getByText('11').parentElement).toHaveTextContent('patch banks');
  });

  it('says nothing at all about releases while the request is in flight', () => {
    // The bug this guards: a falsy check instead of a null check prints
    // "0 releases" on arrival, which is a count the page has not been told yet.
    cover({ releaseCount: null });

    expect(screen.queryByText(/releases/i)).not.toBeInTheDocument();
  });

  it('prints the release figure once it has one', () => {
    cover({ releaseCount: 47 });

    expect(screen.getByText('47').parentElement).toHaveTextContent('releases');
  });

  it('prints a resolved count of zero, which is a fact rather than a gap', () => {
    cover({ releaseCount: 0 });

    expect(screen.getByText('0').parentElement).toHaveTextContent('releases');
  });

  it('sends the reader to the channel in a new tab, safely', () => {
    cover();

    const channel = screen.getByRole('link', { name: /subscribe on youtube/i });
    expect(channel).toHaveAttribute('href', YOUTUBE_CHANNEL_URL);
    expect(channel).toHaveAttribute('target', '_blank');
    expect(channel).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sends the reader to the arcade in the same tab', () => {
    cover();

    const arcade = screen.getByRole('link', { name: /enter the arcade/i });
    expect(arcade).toHaveAttribute('href', '/opus-max-mac-arcade');
    expect(arcade).not.toHaveAttribute('target');
  });

  it('names both actions with the figure that belongs to them', () => {
    cover();

    expect(lineValue('Subscribe on YouTube')).toBe('Channel');
    expect(lineValue('Enter the arcade')).toBe('12 machines');
  });

  it('says in words which part of the orrery is a label and which is measured', () => {
    cover();

    const caption = screen.getByText(/assigned by position in the register/i);
    expect(caption).toHaveTextContent(/the interval on a ring is a designation/i);
    expect(caption).toHaveTextContent(/it is not derived from the bank/i);
    expect(caption).toHaveTextContent(/what the figure measures is the patch count/i);
  });

  it('offers the orrery a stop, and reports whether it is stopped', () => {
    cover();

    const pause = screen.getByRole('button', { name: 'Pause the orrery' });
    expect(pause).toHaveAttribute('aria-pressed', 'false');

    // The label holds still and only `aria-pressed` moves. A toggle that
    // changes both announces "Resume the orrery, pressed" — the state saying
    // the resume has happened while the label says it has not.
    fireEvent.click(pause);
    expect(pause).toHaveAttribute('aria-pressed', 'true');
    expect(pause).toHaveAccessibleName('Pause the orrery');

    fireEvent.click(pause);
    expect(pause).toHaveAttribute('aria-pressed', 'false');
  });

  it('drops the pause control when the reader has already asked for less motion', () => {
    // WCAG 2.2.2 wants a control for motion the page starts on its own. With the
    // operating-system preference set there is nothing left to stop, so a button
    // offering to stop it would be a control that does nothing.
    mockMatchMedia(prefersReducedMotion);
    cover();

    expect(screen.queryByRole('button', { name: /orrery/i })).not.toBeInTheDocument();
  });

  it('still draws the figure and its caption under reduced motion', () => {
    // Motion is meant to be honoured by leaving the resting state as the base
    // style. Hiding the figure instead would leave that reader an empty plate.
    mockMatchMedia(prefersReducedMotion);
    cover();

    expect(screen.getByRole('img', { name: /interval orrery/i })).toBeInTheDocument();
    expect(screen.getByText(/assigned by position in the register/i)).toBeInTheDocument();
  });
});
