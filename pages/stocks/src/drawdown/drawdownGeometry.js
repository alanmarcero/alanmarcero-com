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

/**
 * Downsample plotted coordinates into `maxBuckets` min/max y-envelope buckets
 * so long daily histories stay pixel-accurate without bloating the SVG DOM.
 */
export function downsampleCoords(coords, maxBuckets = 1200) {
  if (coords.length <= maxBuckets * 2 || maxBuckets < 2) return coords;
  const result = [coords[0]];
  const innerCount = coords.length - 2;
  const bucketSize = innerCount / maxBuckets;
  let lastAdded = 0;

  for (let b = 0; b < maxBuckets; b += 1) {
    const start = 1 + Math.floor(b * bucketSize);
    const end = Math.min(coords.length - 1, 1 + Math.floor((b + 1) * bucketSize));
    if (start >= end) continue;
    let minIdx = start;
    let maxIdx = start;
    for (let i = start + 1; i < end; i += 1) {
      if (coords[i].y < coords[minIdx].y) minIdx = i;
      if (coords[i].y > coords[maxIdx].y) maxIdx = i;
    }
    const first = Math.min(minIdx, maxIdx);
    const second = Math.max(minIdx, maxIdx);
    if (first > lastAdded) {
      result.push(coords[first]);
      lastAdded = first;
    }
    if (second > lastAdded) {
      result.push(coords[second]);
      lastAdded = second;
    }
  }

  const tail = coords.length - 1;
  if (lastAdded < tail) result.push(coords[tail]);
  return result;
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
  const traceCoords = downsampleCoords(coords, Math.max(200, Math.round(box.width * 1.2)));
  return {
    domain,
    // magnitudes, top to bottom: 0, 0.25, 0.5 …
    ticks: stackTicks(domain),
    coords,
    line: polyline(traceCoords),
    // the water above the trace, closed along the zero line
    area: areaUnder(traceCoords, { bottom: box.top }),
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

function labelBounds(at, halfWidth, labelHeight) {
  const width = halfWidth * 2;
  let left = at.x - halfWidth;
  if (at.anchor === 'start') left = at.x;
  if (at.anchor === 'end') left = at.x - width;
  return {
    left,
    right: left + width,
    top: at.y - labelHeight / 2,
    bottom: at.y + labelHeight / 2,
  };
}

function boxesOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Place trough depth labels deepest-first without overlapping each other.
 * Each candidate tries below the dot first, then above, and is skipped if
 * neither position clears already-placed labels.
 */
export function placeTroughLabels(
  markers,
  box,
  { gap = 16, halfWidth = 30, labelHeight = 16 } = {},
) {
  const sorted = [...markers].sort((a, b) => a.depth - b.depth);
  const placed = [];
  const occupied = [];

  for (const marker of sorted) {
    const primary = labelPlacement(marker, box, { gap, halfWidth });
    const flippedY = primary.y > marker.y
      ? Math.max(box.top + labelHeight / 2, marker.y - gap * 0.85)
      : Math.min(box.bottom + gap / 2, marker.y + gap);
    const candidates = [primary, { ...primary, y: flippedY }];

    for (const candidate of candidates) {
      const rect = labelBounds(candidate, halfWidth, labelHeight);
      if (!occupied.some((r) => boxesOverlap(r, rect))) {
        occupied.push(rect);
        placed.push({ marker, at: candidate });
        break;
      }
    }
  }
  return placed;
}

export const WINDOWS = [
  { id: 'all', label: 'All', years: null },
  { id: '10y', label: '10Y', years: 10 },
  { id: '5y', label: '5Y', years: 5 },
  { id: '3y', label: '3Y', years: 3 },
  { id: '1y', label: '1Y', years: 1 },
];

export const DEFAULT_WINDOW = 'all';

/** Slice `[date, close]` pairs to the trailing `years` window, or all. */
export function sliceWindow(closes, windowId) {
  const win = WINDOWS.find((w) => w.id === windowId);
  if (!win?.years || !closes.length) return closes;
  const lastDate = closes[closes.length - 1][0];
  const year = Number(lastDate.slice(0, 4)) - win.years;
  const cutoff = `${year}${lastDate.slice(4)}`;
  const startIdx = closes.findIndex(([date]) => date >= cutoff);
  return startIdx <= 0 ? closes : closes.slice(startIdx);
}
