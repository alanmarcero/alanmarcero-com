import { faceplateLayout, blackKeys, BLACK_KEY_OFFSETS } from './faceplate';

const SEEDS = ['Roland SH-01A', 'Waves CODEX', 'Audio Demo MIDIs', 'x', 'longer seed string'];

describe('faceplateLayout', () => {
  it('draws the same machine for the same bank every time', () => {
    expect(faceplateLayout({ seed: 'Waves CODEX' }))
      .toEqual(faceplateLayout({ seed: 'Waves CODEX' }));
  });

  it('draws different machines for different banks', () => {
    // The three drawn plates sit in one column. If the seed did not reach
    // the layout they would be one placeholder repeated, which is the thing
    // this drawing exists to avoid.
    const sh01a = faceplateLayout({ seed: 'Roland SH-01A' });
    const codex = faceplateLayout({ seed: 'Waves CODEX' });
    expect(sh01a.controls).not.toEqual(codex.controls);
  });

  it('keeps every control inside the panel', () => {
    SEEDS.forEach((seed) => {
      const plan = faceplateLayout({ seed, width: 420, height: 150 });
      const { panel } = plan;
      plan.controls.forEach((control) => {
        expect(control.x).toBeGreaterThanOrEqual(panel.x);
        expect(control.x).toBeLessThanOrEqual(panel.x + panel.width);
        expect(control.y).toBeGreaterThanOrEqual(panel.y);
        expect(control.y).toBeLessThanOrEqual(panel.y + panel.height);
      });
    });
  });

  it('always draws at least one control', () => {
    SEEDS.forEach((seed) => {
      expect(faceplateLayout({ seed }).controls.length).toBeGreaterThan(0);
    });
  });

  it('opens with knobs, never with a bank of switches', () => {
    SEEDS.forEach((seed) => {
      const plan = faceplateLayout({ seed });
      const firstSection = plan.sections[0];
      const inFirst = plan.controls.filter(
        (control) => control.x < firstSection.x + firstSection.width,
      );
      expect(inFirst.every((control) => control.type === 'knob')).toBe(true);
    });
  });

  it('gives each section a label and tiles them across the panel', () => {
    const plan = faceplateLayout({ seed: 'sections', width: 400, height: 140 });
    plan.sections.forEach((section, index) => {
      expect(typeof section.label).toBe('string');
      if (index === 0) return;
      const previous = plan.sections[index - 1];
      expect(section.x).toBeCloseTo(previous.x + previous.width, 6);
    });
    const last = plan.sections[plan.sections.length - 1];
    expect(last.x + last.width).toBeCloseTo(plan.panel.x + plan.panel.width, 6);
  });

  it('points knobs away from the dead zone at the bottom of their travel', () => {
    SEEDS.forEach((seed) => {
      faceplateLayout({ seed }).controls
        .filter((control) => control.type === 'knob')
        .forEach(({ angle }) => {
          expect(Math.abs(angle)).toBeLessThanOrEqual(Math.PI * 0.83);
        });
    });
  });

  it('leaves room for a keybed when it draws one', () => {
    const withKeys = SEEDS
      .map((seed) => faceplateLayout({ seed }))
      .filter((plan) => plan.keybed);
    expect(withKeys.length).toBeGreaterThan(0);
    withKeys.forEach((plan) => {
      const lowestControl = Math.max(...plan.controls.map((control) => control.y));
      expect(plan.keybed.y).toBeGreaterThan(lowestControl - plan.keybed.height);
      expect(plan.keybed.y + plan.keybed.height)
        .toBeCloseTo(plan.panel.y + plan.panel.height, 6);
    });
  });
});

describe('blackKeys', () => {
  it('draws nothing without a keybed', () => {
    expect(blackKeys(null)).toEqual([]);
  });

  it('follows the real pattern — no key between E–F or B–C', () => {
    const keybed = { x: 0, y: 0, width: 140, height: 40, keys: 15 };
    const step = keybed.width / keybed.keys;
    const positions = blackKeys(keybed).map((key) => Math.round((key.x + key.width / 2) / step) - 1);
    positions.forEach((index) => {
      expect(BLACK_KEY_OFFSETS).toContain(index % 7);
    });
    // Two full octaves of the pattern: five black keys each.
    expect(positions).toHaveLength(10);
  });

  it('keeps the keys inside the keybed', () => {
    const keybed = { x: 10, y: 100, width: 200, height: 40, keys: 24 };
    blackKeys(keybed).forEach((key) => {
      expect(key.x).toBeGreaterThanOrEqual(keybed.x);
      expect(key.x + key.width).toBeLessThanOrEqual(keybed.x + keybed.width);
      expect(key.height).toBeLessThan(keybed.height);
    });
  });
});
