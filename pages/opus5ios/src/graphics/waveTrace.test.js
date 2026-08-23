import {
  harmonics,
  sampleAt,
  wavePoints,
  linePath,
  silhouettePath,
} from './waveTrace';

describe('harmonics', () => {
  it('is deterministic for a seed', () => {
    expect(harmonics('Nord Lead 3')).toEqual(harmonics('Nord Lead 3'));
  });

  it('gives two instruments different recipes', () => {
    expect(harmonics('Nord Lead 3')).not.toEqual(harmonics('Access Virus TI'));
  });

  it('returns the requested number of partials', () => {
    expect(harmonics('seed', 5)).toHaveLength(5);
  });

  it('decays: no partial is louder than the fundamental', () => {
    ['a', 'b', 'Roland JP-8000', 'Waves CODEX'].forEach((seed) => {
      const partials = harmonics(seed);
      const fundamental = partials[0].amplitude;
      partials.forEach(({ amplitude }) => {
        expect(amplitude).toBeLessThanOrEqual(fundamental);
      });
    });
  });

  it('numbers partials in ascending order', () => {
    const partials = harmonics('order');
    const ascending = [...partials].sort((a, b) => a.harmonic - b.harmonic);
    expect(partials.map((p) => p.harmonic)).toEqual(ascending.map((p) => p.harmonic));
  });
});

describe('sampleAt', () => {
  it('reads zero for a silent series', () => {
    expect(sampleAt([], 0.3)).toBe(0);
  });

  it('is periodic over one cycle', () => {
    const partials = harmonics('periodic');
    expect(sampleAt(partials, 0.25)).toBeCloseTo(sampleAt(partials, 1.25), 10);
  });
});

describe('wavePoints', () => {
  const width = 200;
  const height = 60;

  it('spans the full width and starts at zero', () => {
    const points = wavePoints({ seed: 'span', width, height, samples: 64 });
    expect(points).toHaveLength(65);
    expect(points[0].x).toBe(0);
    expect(points[points.length - 1].x).toBeCloseTo(width, 10);
  });

  it('stays inside the plate', () => {
    ['one', 'two', 'three', 'Moog Slim Phatty'].forEach((seed) => {
      wavePoints({ seed, width, height }).forEach(({ y }) => {
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(height);
      });
    });
  });

  it('normalises so the loudest sample reaches an edge', () => {
    // Without normalisation a steeply decaying series draws a nearly flat
    // line in the middle of its plate; this is the assertion that catches
    // a regression to scaling by the theoretical maximum.
    const points = wavePoints({ seed: 'peak', width, height, samples: 256 });
    const extreme = points.reduce(
      (max, { y }) => Math.max(max, Math.abs(y - height / 2)),
      0,
    );
    expect(extreme).toBeCloseTo(height / 2, 6);
  });

  it('tiles: the trace ends where it began', () => {
    const points = wavePoints({ seed: 'tile', width, height, samples: 128 });
    expect(points[points.length - 1].y).toBeCloseTo(points[0].y, 6);
  });

  it('repeats the same period when asked for several cycles', () => {
    const samples = 120;
    const points = wavePoints({ seed: 'cycles', width, height, samples, cycles: 3 });
    // One third of the way along is one whole period in.
    expect(points[samples / 3].y).toBeCloseTo(points[0].y, 6);
  });

  it('accepts pre-computed partials', () => {
    const partials = harmonics('shared');
    expect(wavePoints({ width, height, partials }))
      .toEqual(wavePoints({ seed: 'shared', width, height }));
  });
});

describe('paths', () => {
  it('starts with a move and continues with lines', () => {
    const path = linePath(wavePoints({ seed: 'path', samples: 4 }));
    expect(path.startsWith('M')).toBe(true);
    expect(path.match(/L/g)).toHaveLength(4);
  });

  it('closes the silhouette and mirrors it about the midline', () => {
    const height = 40;
    const points = wavePoints({ seed: 'silhouette', height, samples: 8 });
    const path = silhouettePath(points, height);
    expect(path.endsWith('Z')).toBe(true);
    // Two passes across the plate — out along the top, back along the
    // mirror — so twice the sample count plus the closing move.
    expect(path.match(/L/g)).toHaveLength(8 + 9);
  });
});
