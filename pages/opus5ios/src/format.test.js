import { serialNumber, demoCountLegend, demoCopy } from './format';

describe('serialNumber', () => {
  it('counts from one, two digits wide', () => {
    expect(serialNumber(0)).toBe('01');
    expect(serialNumber(8)).toBe('09');
    expect(serialNumber(11)).toBe('12');
  });

  it('does not truncate past 99', () => {
    expect(serialNumber(99)).toBe('100');
  });
});

describe('demoCountLegend', () => {
  it('says there is no demo rather than printing zero', () => {
    expect(demoCountLegend(0)).toBe('No demo on file');
  });

  it('agrees in number', () => {
    expect(demoCountLegend(1)).toBe('1 audio demo');
    expect(demoCountLegend(3)).toBe('3 audio demos');
  });
});

describe('demoCopy', () => {
  it('leaves a lone demo unnumbered', () => {
    expect(demoCopy('Nord Lead 3', 0, 1)).toEqual({ cue: 'Hear it', label: 'Hear Nord Lead 3' });
  });

  it('numbers one of several, and says how many there are', () => {
    expect(demoCopy('Virus TI', 1, 3)).toEqual({
      cue: 'Demo 2',
      label: 'Hear Virus TI, demo 2 of 3',
    });
  });
});
