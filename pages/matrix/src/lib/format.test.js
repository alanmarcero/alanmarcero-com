import { pluralize, count, ordinal, demoCopy } from './format';

describe('ordinal', () => {
  it('prints a zero-based index as a two-digit, one-based position', () => {
    expect(ordinal(0)).toBe('01');
    expect(ordinal(8)).toBe('09');
    expect(ordinal(11)).toBe('12');
  });
});

describe('pluralize / count', () => {
  it('agrees the noun with the number', () => {
    expect(pluralize(1, 'bank')).toBe('bank');
    expect(pluralize(0, 'bank')).toBe('banks');
    expect(pluralize(2, 'patch', 'patches')).toBe('patches');
    expect(count(1, 'release')).toBe('1 release');
    expect(count(1280, 'patch', 'patches')).toBe('1,280 patches');
  });
});

describe('demoCopy', () => {
  it('names a lone demo "Hear it" and keeps that cue inside its label', () => {
    const copy = demoCopy('Moog Sub 37', 0, 1);
    expect(copy).toEqual({
      cue: 'Hear it',
      label: 'Hear it — Moog Sub 37',
      stopLabel: 'Stop demo — Moog Sub 37',
    });
  });

  it('numbers demos when a bank has several', () => {
    const copy = demoCopy('Nord Lead 3', 1, 3);
    expect(copy).toEqual({
      cue: 'Demo 2',
      label: 'Demo 2 of 3 — Nord Lead 3',
      stopLabel: 'Stop demo 2 — Nord Lead 3',
    });
  });

  it('starts every accessible name with its visible cue', () => {
    [demoCopy('X', 0, 1), demoCopy('X', 0, 2), demoCopy('X', 1, 2)].forEach(({ cue, label }) => {
      expect(label.startsWith(cue)).toBe(true);
    });
  });
});
