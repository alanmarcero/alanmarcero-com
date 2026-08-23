import { parseRelease, groupByWork } from './useMusic';

/**
 * Fixtures are the nine titles the API actually returned on 2026-08-22,
 * verbatim. A parser tested only on invented strings is tested against the
 * author's idea of the data.
 */
const REAL_TITLES = [
  'Alan-M - Famicom',
  'Johnson & Corbett Vs. Alan-M - Ibiza Sun (Aramanja Remix)',
  'Sean Tyas - Melbourne (Alan-M Remix)',
  'Johnson & Corbett Vs. Alan-M - Ibiza Sun (Original Mix)',
  'Alan-M - Sakura',
  'Alan-M - Remember Me (Cressida Remix)',
  'Alan-M - Remember Me',
  'Alan-M - Nothing Forgotten',
  'Alan-M - Famicom (Temple 1 Remix)',
];

const asItems = (titles) => titles.map((title, i) => ({ title, videoId: `v${i}` }));
const parseAll = (titles) => asItems(titles).map(parseRelease);

describe('parseRelease', () => {
  it('splits artists, work and version', () => {
    expect(parseRelease({ title: 'Sean Tyas - Melbourne (Alan-M Remix)' })).toMatchObject({
      artists: 'Sean Tyas',
      work: 'Melbourne',
      version: 'Alan-M Remix',
    });
  });

  it('reads no version when there is no trailing parenthetical', () => {
    expect(parseRelease({ title: 'Alan-M - Sakura' })).toMatchObject({
      artists: 'Alan-M',
      work: 'Sakura',
      version: null,
      isOriginal: true,
      role: 'original',
    });
  });

  it('treats "(Original Mix)" as the original rather than a rework', () => {
    const parsed = parseRelease({ title: 'Johnson & Corbett Vs. Alan-M - Ibiza Sun (Original Mix)' });
    expect(parsed.version).toBe('Original Mix');
    expect(parsed.isOriginal).toBe(true);
    expect(parsed.role).toBe('original');
  });

  it('calls it "remixer" when he reworked someone else', () => {
    expect(parseRelease({ title: 'Sean Tyas - Melbourne (Alan-M Remix)' }).role).toBe('remixer');
  });

  it('calls it "remixed" when someone reworked him', () => {
    expect(parseRelease({ title: 'Alan-M - Remember Me (Cressida Remix)' }).role).toBe('remixed');
  });

  it('keeps "Vs." collaborations intact in the artist field', () => {
    expect(parseRelease({ title: 'Johnson & Corbett Vs. Alan-M - Ibiza Sun (Aramanja Remix)' }).artists)
      .toBe('Johnson & Corbett Vs. Alan-M');
  });

  it('splits on the FIRST separator, leaving later ones in the work', () => {
    expect(parseRelease({ title: 'A - B - C' })).toMatchObject({ artists: 'A', work: 'B - C' });
  });

  it('treats a title with no separator as all work and no artist', () => {
    expect(parseRelease({ title: 'Untitled Sketch' })).toMatchObject({
      artists: null,
      work: 'Untitled Sketch',
    });
  });

  it('never returns an unrenderable work, even for an empty title', () => {
    for (const title of ['', '   ', undefined, null]) {
      const parsed = parseRelease({ title });
      expect(parsed.work).toBeTruthy();
      expect(typeof parsed.work).toBe('string');
    }
    expect(parseRelease({}).work).toBe('Untitled');
  });

  it('does not let an unbalanced parenthesis swallow the title', () => {
    const parsed = parseRelease({ title: 'Alan-M - Famicom (unclosed' });
    expect(parsed.version).toBeNull();
    expect(parsed.work).toBe('Famicom (unclosed');
  });

  it('preserves videoId and other fields', () => {
    expect(parseRelease({ title: 'Alan-M - Sakura', videoId: 'abc' }).videoId).toBe('abc');
  });

  it('is case-insensitive about who the remixer is', () => {
    expect(parseRelease({ title: 'Someone - Track (ALAN-M remix)' }).role).toBe('remixer');
  });
});

describe('groupByWork', () => {
  it('collapses the nine real releases into six works', () => {
    const groups = groupByWork(parseAll(REAL_TITLES));
    expect(groups).toHaveLength(6);
    expect(groups.reduce((n, g) => n + g.versions.length, 0)).toBe(9);
  });

  it('finds exactly the three works that have a second version', () => {
    const multi = groupByWork(parseAll(REAL_TITLES))
      .filter((g) => g.versions.length > 1)
      .map((g) => g.work);
    expect(multi).toEqual(['Famicom', 'Ibiza Sun', 'Remember Me']);
  });

  it('puts the original ahead of its reworks', () => {
    const famicom = groupByWork(parseAll(REAL_TITLES)).find((g) => g.work === 'Famicom');
    expect(famicom.versions.map((v) => v.role)).toEqual(['original', 'remixed']);
  });

  it('preserves the order the API sent the works in', () => {
    expect(groupByWork(parseAll(REAL_TITLES)).map((g) => g.work))
      .toEqual(['Famicom', 'Ibiza Sun', 'Melbourne', 'Sakura', 'Remember Me', 'Nothing Forgotten']);
  });

  it('holds at zero releases', () => {
    expect(groupByWork([])).toEqual([]);
  });

  it('holds at one release', () => {
    const groups = groupByWork(parseAll(['Alan-M - Sakura']));
    expect(groups).toHaveLength(1);
    expect(groups[0].versions).toHaveLength(1);
  });

  it('groups case-insensitively so one work does not split in two', () => {
    const groups = groupByWork(parseAll(['Alan-M - Sakura', 'Alan-M - SAKURA (Live)']));
    expect(groups).toHaveLength(1);
    expect(groups[0].versions).toHaveLength(2);
  });

  it('gives every group a key usable as a React key', () => {
    for (const group of groupByWork(parseAll(REAL_TITLES))) {
      expect(typeof group.key).toBe('string');
      expect(group.key.length).toBeGreaterThan(0);
    }
  });
});
