import { useMemo } from 'react';
import useInViewport from '../../../../src/hooks/useInViewport';
import DrawdownPanel from '../drawdown/components/DrawdownPanel';
import { DEFAULT_WINDOW, sliceWindow } from '../drawdown/drawdownGeometry';
import { deepestAtLeast, drawdownEpisodes, underwater } from '../drawdown/drawdowns';
import { formatDate } from '../drawdown/format';
import useCloses from '../useCloses';
import { anchorOf, titleOf } from '../instruments';

const WINDOW_DEPTH_CAP = {
  all: Infinity,
  '10y': Infinity,
  '5y': 0.10,
  '3y': 0.05,
  '1y': 0.03,
};

/**
 * One instrument's drawdown panel. Its closes are imported only as the panel
 * nears the viewport, so the page never downloads dozens of series upfront.
 */
function InstrumentPanel({ instrument, hold, windowId = DEFAULT_WINDOW }) {
  const [ref, near] = useInViewport({ rootMargin: '800px 0px' });
  const { status, closes } = useCloses(instrument.load, near);

  const windowCloses = useMemo(
    () => (closes ? sliceWindow(closes, windowId) : null),
    [closes, windowId],
  );
  const effectiveHold = useMemo(() => {
    const cap = WINDOW_DEPTH_CAP[windowId] ?? Infinity;
    if (hold.minDepth <= cap) return hold;
    return { ...hold, minDepth: cap };
  }, [hold, windowId]);

  const series = useMemo(() => (windowCloses
    ? { points: underwater(windowCloses), episodes: drawdownEpisodes(windowCloses) }
    : null), [windowCloses]);
  const episodes = useMemo(
    () => (series ? deepestAtLeast(series.episodes, effectiveHold.minDepth) : []),
    [series, effectiveHold.minDepth],
  );

  const id = anchorOf(instrument);
  const firstDate = windowCloses?.length ? windowCloses[0][0] : instrument.first;
  const lastDate = windowCloses?.length ? windowCloses[windowCloses.length - 1][0] : instrument.last;
  const sessionCount = windowCloses?.length ?? instrument.sessions;
  const kicker = `${instrument.name} · ${formatDate(firstDate)} to `
    + `${formatDate(lastDate)} · ${sessionCount.toLocaleString('en-US')} closes`;

  if (!series) {
    return (
      <section ref={ref} className="dd-panel st-pending" id={id} aria-labelledby={`${id}-heading`}>
        <div className="dd-panel__head">
          <h2 className="dd-panel__title" id={`${id}-heading`}>{titleOf(instrument)}</h2>
          <p className="dd-panel__kicker">{kicker}</p>
        </div>
        <div className="st-placeholder" aria-hidden={status !== 'error'}>
          {status === 'error' && <p className="dd-panel__note">This series did not load. Reload the page to try again.</p>}
        </div>
      </section>
    );
  }

  return (
    <DrawdownPanel
      id={id}
      title={titleOf(instrument)}
      kicker={kicker}
      points={series.points}
      episodes={episodes}
      hold={effectiveHold}
      subject={`${instrument.label} daily close`}
    />
  );
}

export default InstrumentPanel;
