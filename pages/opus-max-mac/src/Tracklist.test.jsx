/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import Tracklist from './Tracklist';
import { YOUTUBE_CHANNEL_URL } from '../../../src/config';

const TRACKS = [
  { title: 'Aurora Borealis (Original Mix)', videoId: 'aaaaaaaaaaa' },
  { title: 'Melbourne (Alan-M Remix)', videoId: 'bbbbbbbbbbb' },
  { title: 'Signal Path', videoId: 'ccccccccccc' },
];

const log = (overrides = {}) =>
  render(
    <Tracklist tracks={[]} loading={false} error={null} query="" {...overrides} />,
  );

/** The figure a register line prints, with its label taken off the front. */
const lineValue = (label) =>
  screen.getByText(label).parentElement.textContent.slice(label.length);

describe('Tracklist', () => {
  it('announces that it is reading the log, and claims nothing else yet', () => {
    log({ loading: true });

    const states = screen.getAllByRole('status');
    expect(states).toHaveLength(1);
    expect(states[0]).toHaveTextContent(/reading the log/i);
    expect(screen.queryByText(/could not be read/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/the log is empty/i)).not.toBeInTheDocument();
  });

  it('announces a failure instead of an empty log', () => {
    log({ error: 'Request failed: 500' });

    const states = screen.getAllByRole('status');
    expect(states).toHaveLength(1);
    expect(states[0]).toHaveTextContent(/could not be read/i);
    expect(screen.queryByText(/reading the log/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/the log is empty/i)).not.toBeInTheDocument();
  });

  it('still hands the reader a way to the music when the log cannot be read', () => {
    log({ error: 'Request failed: 500' });

    const escape = within(screen.getByRole('status')).getByRole('link', { name: 'YouTube' });
    expect(escape).toHaveAttribute('href', YOUTUBE_CHANNEL_URL);
    expect(escape).toHaveAttribute('target', '_blank');
    expect(escape).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('says the log is empty only once it is neither loading nor broken', () => {
    // Nothing is asserted here about the state being announced: unlike its two
    // siblings this paragraph carries no role="status", so the message that
    // replaces "Reading the log…" reaches a screen reader as silence. Reported
    // rather than pinned down, so fixing it does not fail this test.
    log();

    expect(screen.getByText(/the log is empty just now/i)).toBeInTheDocument();
    expect(screen.queryByText(/reading the log/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/could not be read/i)).not.toBeInTheDocument();
  });

  it('gives every track a row with its title and a way to play it', () => {
    log({ tracks: TRACKS });

    expect(screen.getAllByRole('listitem')).toHaveLength(TRACKS.length);

    TRACKS.forEach((track) => {
      const row = screen.getByText(track.title).closest('li');
      expect(within(row).getByRole('heading', { level: 3 })).toHaveTextContent(track.title);
      expect(within(row).getByRole('button', { name: `Play ${track.title}` }))
        .toBeInTheDocument();
    });
  });

  it('marks a title that says remix as one, and everything else as an original', () => {
    // The API returns a title and a video id and nothing else, so this is the
    // only claim a row can make beyond the title itself — and it has to follow
    // the title rather than the row's position.
    log({ tracks: TRACKS });

    expect(lineValue('Melbourne (Alan-M Remix)')).toBe('Remix');
    expect(lineValue('Aurora Borealis (Original Mix)')).toBe('Original');
    expect(lineValue('Signal Path')).toBe('Original');
  });

  it('counts the entries it is showing', () => {
    log({ tracks: TRACKS });

    expect(screen.getByText(/^Log · 3 entries · YouTube$/)).toBeInTheDocument();
  });

  it('names the query when a search empties the log', () => {
    log({ query: 'oboe' });

    const state = screen.getByText(/nothing in the log matches/i);
    expect(state).toHaveTextContent('oboe');
    expect(screen.queryByText(/the log is empty just now/i)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('loads nothing from youtube.com until a row is played', () => {
    const { container } = log({ tracks: TRACKS });

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });
});
