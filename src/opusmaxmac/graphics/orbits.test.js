import {
  INTERVALS,
  BASE_PERIOD,
  RADIUS_RANGE,
  FAINTEST_MAGNITUDE,
  BRIGHTEST_MAGNITUDE,
  designationFor,
  intervalAt,
  orbitsFor,
  labelledOrbits,
  bodyPoint,
  closestApproach,
} from './orbits';
import { patchBanks } from '../../data/patchBanks';

describe('the scale', () => {
  it('is eleven just intervals, ascending', () => {
    expect(INTERVALS).toHaveLength(11);
    const values = INTERVALS.map(([num, den]) => num / den);
    const ascending = [...values].sort((a, b) => a - b);
    expect(values).toEqual(ascending);
    expect(values[0]).toBe(1);
    expect(values[values.length - 1]).toBe(2);
  });

  it('names an interval and its size in cents', () => {
    expect(intervalAt(0)).toMatchObject({ label: '1:1', cents: 0 });
    expect(intervalAt(6)).toMatchObject({ label: '3:2', cents: 702 });
    expect(intervalAt(10)).toMatchObject({ label: '2:1', cents: 1200 });
  });

  it('carries on into the next octave rather than repeating a ring', () => {
    expect(intervalAt(11)).toMatchObject({ label: '2:1', cents: 1200 });
    expect(intervalAt(12)).toMatchObject({ label: '32:15', cents: 1312 });
    expect(intervalAt(21).value).toBeGreaterThan(intervalAt(10).value);
  });
});

describe('designationFor', () => {
  it('numbers in roman', () => {
    expect(designationFor(0)).toBe('I');
    expect(designationFor(10)).toBe('XI');
  });

  it('falls back to arabic past the table', () => {
    expect(designationFor(20)).toBe('21');
  });
});

describe('orbitsFor', () => {
  const bodies = orbitsFor(patchBanks);

  it('plots one body per bank', () => {
    expect(bodies).toHaveLength(patchBanks.length);
    expect(bodies.map((body) => body.designation)).toEqual([
      'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI',
    ]);
  });

  it('returns nothing for nothing', () => {
    expect(orbitsFor([])).toEqual([]);
    expect(orbitsFor()).toEqual([]);
  });

  it('spaces the orbits strictly, inside the field', () => {
    const radii = bodies.map((body) => body.radius);
    for (let index = 1; index < radii.length; index += 1) {
      expect(radii[index]).toBeLessThan(radii[index - 1]);
    }
    expect(Math.max(...radii)).toBeCloseTo(RADIUS_RANGE[1], 10);
    expect(Math.min(...radii)).toBeCloseTo(RADIUS_RANGE[0], 10);
  });

  it('turns the higher interval faster, as Kepler has it', () => {
    const periods = bodies.map((body) => body.period);
    for (let index = 1; index < periods.length; index += 1) {
      expect(periods[index]).toBeLessThan(periods[index - 1]);
    }
    expect(periods[0]).toBe(BASE_PERIOD);
    expect(periods[periods.length - 1]).toBe(BASE_PERIOD / 2);
  });

  it('keeps the inner orbit the fast one', () => {
    // Kepler's law is the whole reason radius and period move together; if a
    // future change breaks the pairing the diagram stops meaning anything.
    const sortedByRadius = [...bodies].sort((a, b) => a.radius - b.radius);
    const sortedByPeriod = [...bodies].sort((a, b) => a.period - b.period);
    expect(sortedByRadius.map((body) => body.index)).toEqual(
      sortedByPeriod.map((body) => body.index),
    );
  });

  it('brightens with the patch count', () => {
    const prophet = bodies[0];
    const shO1a = bodies.find((body) => body.bank.name === 'Roland SH-01A');

    expect(prophet.bank.count).toBe(128);
    expect(prophet.magnitude).toBeCloseTo(BRIGHTEST_MAGNITUDE, 5);

    expect(shO1a.bank.count).toBe(64);
    expect(shO1a.magnitude).toBeGreaterThan(prophet.magnitude);
    expect(shO1a.bodyRadius).toBeLessThan(prophet.bodyRadius);
  });

  it('marks the one entry with no patch count as unlisted and faintest', () => {
    const unlisted = bodies.filter((body) => body.unlisted);
    expect(unlisted).toHaveLength(1);
    expect(unlisted[0].bank.name).toBe('Audio Demo MIDIs');
    expect(unlisted[0].magnitude).toBe(FAINTEST_MAGNITUDE);
  });

  it('starts the bodies well apart rather than in a row', () => {
    const phases = bodies.map((body) => body.phase).sort((a, b) => a - b);
    const gaps = phases.slice(1).map((value, index) => value - phases[index]);
    expect(Math.min(...gaps)).toBeGreaterThan(0.25);
  });

  it('keeps neighbouring bodies clear of each other', () => {
    // Kepler sets the spacing and the body scale has to live inside it. The
    // tightest pair is what decides how large a body may be drawn; if a later
    // change closes that gap, this is the assertion that notices.
    const gap = closestApproach(bodies, 44);
    const widest = Math.max(...bodies.map((body) => body.bodyRadius));
    expect(gap).toBeGreaterThan(widest * 2);
  });

  it('gives every body a finite size, including the one with no patch count', () => {
    bodies.forEach((body) => {
      expect(Number.isFinite(body.bodyRadius)).toBe(true);
      expect(Number.isFinite(body.haloRadius)).toBe(true);
      expect(Number.isFinite(body.radius)).toBe(true);
      expect(Number.isFinite(body.magnitude)).toBe(true);
      expect(Number.isFinite(body.period)).toBe(true);
      expect(Number.isFinite(body.phase)).toBe(true);
    });
  });

  it('draws the same diagram every time', () => {
    expect(orbitsFor(patchBanks)).toEqual(bodies);
  });

  it('survives a single bank', () => {
    const [only] = orbitsFor([{ name: 'One', count: 10 }]);
    expect(only.radius).toBeCloseTo(RADIUS_RANGE[1], 10);
    expect(only.period).toBe(BASE_PERIOD);
  });
});

describe('labelledOrbits', () => {
  const bodies = orbitsFor(patchBanks);

  it('picks three rings spread across the field', () => {
    const picked = labelledOrbits(bodies);
    expect(picked).toHaveLength(3);
    expect(picked.map((body) => body.index)).toEqual([0, 5, 10]);
  });

  it('labels everything when there is little to label', () => {
    const few = bodies.slice(0, 2);
    expect(labelledOrbits(few)).toEqual(few);
  });
});

describe('bodyPoint', () => {
  it('places a body on its own orbit', () => {
    const [first] = orbitsFor(patchBanks);
    const { x, y } = bodyPoint(first, 46);
    expect(Math.hypot(x, y)).toBeCloseTo(first.radius * 46, 6);
  });
});
