/* ==========================================================================
   drawdownGeometry.js — geometry for the underwater chart.

   Zero sits along the top edge and a loss hangs below it, so a drawdown
   reads as depth. The y scale is the magnitude of the loss on the same round
   zero-based domain the other charts use; only its direction is flipped.
   ========================================================================== */

import {
  areaUnder, polyline, stackDomain, stackTicks, xAt,
} from './chartGeometry';

/** A loss (a negative depth) onto the plot: zero at the top, deeper lower. */
export function depthY(depth, domain, box) {
  if (domain.max <= 0) return box.top;
  const fraction = Math.min(1, Math.max(0, -depth / domain.max));
  return box.top + fraction * box.height;
}

/** The daily underwater series placed in a plot box. */
export function underwaterPlot(points, box, tickCount = 4) {
  const domain = stackDomain(points.map((p) => -p.depth), tickCount);
  const coords = points.map((p, index) => ({
    ...p,
    index,
    x: xAt(index, points.length, box),
    y: depthY(p.depth, domain, box),
  }));
  return {
    domain,
    // magnitudes, top to bottom: 0, 0.25, 0.5 …
    ticks: stackTicks(domain),
    coords,
    line: polyline(coords),
    // the water above the trace, closed along the zero line
    area: areaUnder(coords, { bottom: box.top }),
  };
}

/** A date -> session index lookup for the daily series. */
export function dateIndexMap(points) {
  return new Map(points.map((p, i) => [p.date, i]));
}

/**
 * A marker at the bottom of every drawdown in `episodes`, at the session its
 * trough closed on.
 */
export function troughMarkers(episodes, dateIndex, coords) {
  return episodes.reduce((markers, episode) => {
    const index = dateIndex.get(episode.troughDate);
    if (index === undefined) return markers;
    markers.push({
      ...episode, index, x: coords[index].x, y: coords[index].y,
    });
    return markers;
  }, []);
}

/**
 * Session indices of local swing troughs where the price fell at least
 * `threshold` from a local peak and then bounced at least `rebound`.
 */
export function significantDropIndices(points, maxDepth) {
  if (points.length < 2) return [];
  const threshold = Math.max(0.05, maxDepth * 0.12);
  const rebound = threshold * 0.6;
  const indices = [];
  let peak = points[0].close;
  let trough = peak;
  let troughIdx = 0;
  let inDrop = false;

  for (let i = 1; i < points.length; i += 1) {
    const { close } = points[i];
    if (inDrop) {
      if (close < trough) {
        trough = close;
        troughIdx = i;
      } else if (close >= trough * (1 + rebound)) {
        indices.push(troughIdx);
        peak = close;
        trough = close;
        troughIdx = i;
        inDrop = false;
      }
    } else if (close > peak) {
      peak = close;
      trough = close;
      troughIdx = i;
    } else if (close <= peak * (1 - threshold)) {
      trough = close;
      troughIdx = i;
      inDrop = true;
    }
  }
  if (inDrop) indices.push(troughIdx);
  return indices;
}

/** Nearest index in `snapIndices` to viewBox x `vx`. */
export function nearestSnapIndex(vx, snapIndices, coords) {
  if (!Number.isFinite(vx) || !snapIndices.length) return null;
  let best = snapIndices[0];
  let bestDist = Math.abs(coords[best].x - vx);
  for (let i = 1; i < snapIndices.length; i += 1) {
    const idx = snapIndices[i];
    const dist = Math.abs(coords[idx].x - vx);
    if (dist < bestDist) {
      best = idx;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Every `stride`-th year tick, where the stride is the smallest that keeps
 * labels `minGap` user units apart on average: 19 years fit a wide plot, 34
 * do not. `count` is the number of sessions the x axis spans.
 */
export function thinYears(ticks, count, box, minGap) {
  if (ticks.length < 2) return ticks;
  const perSession = box.width / Math.max(1, count - 1);
  const first = ticks[0].index;
  const last = ticks[ticks.length - 1].index;
  const spacing = ((last - first) / (ticks.length - 1)) * perSession;
  const stride = Math.max(1, Math.ceil(minGap / spacing));
  return ticks.filter((_, i) => i % stride === 0);
}

/**
 * Where a trough's depth label goes: under the marker unless that would run
 * off the bottom, and anchored so it never runs off either side.
 */
export function labelPlacement(marker, box, { gap = 16, halfWidth = 30 } = {}) {
  const below = marker.y + gap <= box.bottom + gap / 2;
  let anchor = 'middle';
  if (marker.x + halfWidth > box.right) anchor = 'end';
  if (marker.x - halfWidth < box.left) anchor = 'start';
  return {
    x: marker.x,
    y: below ? marker.y + gap : marker.y - gap * 0.6,
    anchor,
  };
}
