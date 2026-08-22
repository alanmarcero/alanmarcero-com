import {
  totalPatches,
  patchBankCount,
  instrumentCount,
  matchesQuery,
} from './catalog';
import { patchBanks } from '../../data/patchBanks';

describe('totalPatches', () => {
  it('sums counts and ignores banks without one', () => {
    expect(totalPatches([{ count: 128 }, { count: 64 }, {}])).toBe(192);
  });

  it('is 0 for an empty catalog', () => {
    expect(totalPatches([])).toBe(0);
  });
});

describe('patchBankCount', () => {
  it('counts only banks that ship patches', () => {
    expect(patchBankCount([{ count: 128 }, { count: 1 }, {}])).toBe(2);
  });
});

describe('instrumentCount', () => {
  it('counts instruments, not banks', () => {
    const banks = [
      { count: 128, instruments: ['Prophet 08', 'Prophet Rev2', 'Mopho'] },
      { count: 128, instruments: ['Nord Lead 3', 'Nord Rack 3'] },
    ];
    expect(instrumentCount(banks)).toBe(5);
    expect(patchBankCount(banks)).toBe(2);
  });

  it('de-duplicates an instrument covered by two banks', () => {
    const banks = [
      { instruments: ['Nord Lead 2'] },
      { instruments: ['Nord Lead 2', 'Nord Lead 2X'] },
    ];
    expect(instrumentCount(banks)).toBe(2);
  });

  it('ignores entries with no instruments, such as the MIDI download', () => {
    expect(instrumentCount([{ instruments: ['Roland JP-08'] }, {}])).toBe(1);
  });
});

describe('matchesQuery', () => {
  it('matches case-insensitively across any field', () => {
    expect(matchesQuery('nord', 'Nord Lead 3', 'desc')).toBe(true);
    expect(matchesQuery('TRANCE', 'Nord Lead 3', '128 trance patches')).toBe(true);
  });

  it('matches everything when the query is empty', () => {
    expect(matchesQuery('', 'anything')).toBe(true);
    expect(matchesQuery(undefined, 'anything')).toBe(true);
  });

  it('tolerates missing fields', () => {
    expect(matchesQuery('nord', undefined, null, 'Nord')).toBe(true);
    expect(matchesQuery('moog', undefined, null)).toBe(false);
  });
});

// Guards the real claim the hero renders. These are the numbers a visitor
// reads, so they are asserted against the shipped data, not a fixture.
describe('the shipped catalog', () => {
  it('covers more instruments than it has banks', () => {
    expect(instrumentCount(patchBanks)).toBeGreaterThan(patchBankCount(patchBanks));
  });

  it('reports 1,148 patches across 25 instruments in 10 banks', () => {
    expect(totalPatches(patchBanks)).toBe(1148);
    expect(instrumentCount(patchBanks)).toBe(25);
    expect(patchBankCount(patchBanks)).toBe(10);
  });

  it('gives every patch-shipping bank at least one instrument', () => {
    const missing = patchBanks
      .filter((bank) => bank.count)
      .filter((bank) => !bank.instruments?.length)
      .map((bank) => bank.name);
    expect(missing).toEqual([]);
  });
});
