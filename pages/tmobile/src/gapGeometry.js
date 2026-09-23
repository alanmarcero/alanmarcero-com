/* ==========================================================================
   gapGeometry.js — geometry for the quiet-stretch chart.

   The sawtooth shares its x axis with the price chart above it: a point sits
   at the same x as that week does up there, so the two plots can be read
   against each other. Everything else is composed from the geometry the other
   two charts already use, rather than restated here.
   ========================================================================== */

import { areaUnder, polyline, xAt } from './chartGeometry';
import { amountY, stackDomain, stackTicks } from './monthlyGeometry';

/**
 * A gap series placed in a plot box, keyed to the price series' own week
 * index so the two charts line up week for week.
 */
export function gapPlot(points, weekIndex, weekCount, box, tickCount = 4) {
  const domain = stackDomain(points.map((p) => p.days), tickCount);
  const coords = points
    .filter((p) => weekIndex.has(p.week))
    .map((p) => ({
      ...p,
      x: xAt(weekIndex.get(p.week), weekCount, box),
      y: amountY(p.days, domain, box),
    }));
  return {
    domain,
    ticks: stackTicks(domain),
    coords,
    line: polyline(coords),
    area: areaUnder(coords, box),
  };
}

/** Nearest plotted point to a pointer at `px`; null for an empty series. */
export function nearestIndex(coords, px) {
  if (!coords.length) return null;
  return coords.reduce(
    (best, coord, index) => (Math.abs(coord.x - px) < Math.abs(coords[best].x - px) ? index : best),
    0,
  );
}

/**
 * The stretch of the trace that is the open gap — drawn lit, because the run
 * that has not ended yet is the one the page is about. It starts at the last
 * point on or before the last sale, so the whole climb is covered.
 */
export function openRun(coords, since) {
  if (!coords.length || !since) return [];
  const start = coords.findIndex((c) => c.since === since);
  if (start < 0) return [];
  return coords.slice(start);
}
