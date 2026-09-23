import {
  dateIndexMap, depthY, labelPlacement, troughMarkers, underwaterPlot,
} from './drawdownGeometry';
import { plotBox } from './chartGeometry';
import { drawdownEpisodes, underwater } from './drawdowns';

const BOX = plotBox(500, 300, {
  top: 20, right: 20, bottom: 40, left: 40,
});

const CLOSES = [
  ['2025-01-01', 100],
  ['2025-01-02', 60],
  ['2025-01-03', 110],
  ['2025-01-04', 99],
];
const POINTS = underwater(CLOSES);

describe('depthY', () => {
  const domain = { min: 0, max: 0.5, step: 0.1 };

  it('puts zero on the top edge and the full domain on the bottom', () => {
    expect(depthY(0, domain, BOX)).toBe(BOX.top);
    expect(depthY(-0.5, domain, BOX)).toBe(BOX.bottom);
    expect(depthY(-0.25, domain, BOX)).toBe(BOX.top + BOX.height / 2);
  });

  it('clamps anything past the domain', () => {
    expect(depthY(-2, domain, BOX)).toBe(BOX.bottom);
    expect(depthY(0.1, domain, BOX)).toBe(BOX.top);
  });
});

describe('underwaterPlot', () => {
  const plot = underwaterPlot(POINTS, BOX);

  it('snaps the domain to a round step past the deepest loss', () => {
    expect(plot.domain.max).toBeGreaterThanOrEqual(0.4);
    expect(plot.ticks[0]).toBe(0);
  });

  it('spans the box left to right, one point per session', () => {
    expect(plot.coords).toHaveLength(4);
    expect(plot.coords[0].x).toBe(BOX.left);
    expect(plot.coords[3].x).toBe(BOX.right);
    expect(plot.coords[0].y).toBe(BOX.top);
  });

  it('closes the wash along the zero line, not the floor', () => {
    expect(plot.area.endsWith(`L${BOX.left.toFixed(2)},${BOX.top.toFixed(2)}Z`)).toBe(true);
  });
});

describe('troughMarkers', () => {
  it('sits each marker on its trough session', () => {
    const plot = underwaterPlot(POINTS, BOX);
    const markers = troughMarkers(drawdownEpisodes(CLOSES), dateIndexMap(POINTS), plot.coords);
    expect(markers.map((m) => m.troughDate)).toEqual(['2025-01-02', '2025-01-04']);
    expect(markers[0].y).toBe(plot.coords[1].y);
  });

  it('drops an episode whose trough is not in the series', () => {
    const plot = underwaterPlot(POINTS, BOX);
    const stray = [{ troughDate: '1999-01-01' }];
    expect(troughMarkers(stray, dateIndexMap(POINTS), plot.coords)).toEqual([]);
  });
});

describe('labelPlacement', () => {
  it('goes under the marker, centred, in the open', () => {
    expect(labelPlacement({ x: 200, y: 100 }, BOX)).toEqual({ x: 200, y: 116, anchor: 'middle' });
  });

  it('flips above the marker at the floor', () => {
    expect(labelPlacement({ x: 200, y: BOX.bottom }, BOX).y).toBeLessThan(BOX.bottom);
  });

  it('anchors inward at either edge', () => {
    expect(labelPlacement({ x: BOX.right, y: 100 }, BOX).anchor).toBe('end');
    expect(labelPlacement({ x: BOX.left, y: 100 }, BOX).anchor).toBe('start');
  });
});
