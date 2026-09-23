import {
  imageFor,
  credits,
  bankSizeLabel,
  filterBanks,
  filterReleases,
  resultSummary,
  isTypingTarget,
} from './catalog';
import { patchBanks } from '../../../../src/data/patchBanks';
import { codexImages, imageFor as opusImageFor } from '../../../opus5ios/src/data/synthImages';

describe('imageFor', () => {
  it('prefers this route\'s own photograph', () => {
    Object.keys(codexImages).forEach((bank) => {
      expect(imageFor(bank)).toBe(codexImages[bank]);
    });
  });

  it('falls back to the /opus5ios photograph, and to null when there is none', () => {
    const fallback = patchBanks.find((bank) => !codexImages[bank.name] && opusImageFor(bank.name));
    expect(imageFor(fallback.name)).toBe(opusImageFor(fallback.name));
    expect(imageFor('No such instrument')).toBeNull();
  });
});

describe('credits', () => {
  it('credits each bank once', () => {
    const banks = credits.map(({ bank }) => bank);
    expect(new Set(banks).size).toBe(banks.length);
  });

  it('credits the photograph the page shows for that bank', () => {
    credits.forEach((credit) => {
      expect(imageFor(credit.bank).slug).toBe(credit.slug);
    });
  });
});

describe('bankSizeLabel', () => {
  it('counts patches, and names a countless bank by its contents', () => {
    expect(bankSizeLabel({ count: 128 })).toBe('128 patches');
    expect(bankSizeLabel({})).toBe('MIDI files');
  });
});

describe('filterBanks', () => {
  it('returns every bank for an empty query', () => {
    expect(filterBanks(patchBanks, '')).toEqual(patchBanks);
  });

  it('matches instrument names as well as the bank name', () => {
    const bank = { name: 'Sequential Prophet 08', description: '', instruments: ['Mopho'] };
    expect(filterBanks([bank], 'mopho')).toEqual([bank]);
    expect(filterBanks([bank], 'virus')).toEqual([]);
  });

  it('does not mutate its input', () => {
    const banks = [...patchBanks];
    filterBanks(banks, 'nord');
    expect(banks).toEqual(patchBanks);
  });
});

describe('filterReleases', () => {
  it('matches title or description, case-insensitively', () => {
    const items = [
      { title: 'Famicom', description: '' },
      { title: 'Melbourne', description: 'A Sean Tyas remix' },
    ];
    expect(filterReleases(items, 'FAMI')).toEqual([items[0]]);
    expect(filterReleases(items, 'tyas')).toEqual([items[1]]);
  });
});

describe('resultSummary', () => {
  it('agrees each noun with its number', () => {
    expect(resultSummary(1, 1)).toBe('1 bank · 1 release');
    expect(resultSummary(3, 0)).toBe('3 banks · 0 releases');
  });

  it('leaves out a release count that is not known yet', () => {
    expect(resultSummary(2, null)).toBe('2 banks');
  });
});

describe('isTypingTarget', () => {
  it('recognises text fields and editable content', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
  });

  it('rejects everything else, including no element at all', () => {
    expect(isTypingTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
