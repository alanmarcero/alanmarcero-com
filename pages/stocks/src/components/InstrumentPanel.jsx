import { useMemo } from 'react';
import useInViewport from '../../../../src/hooks/useInViewport';
import DrawdownPanel from '../../../tmobile/src/components/DrawdownPanel';
import { drawdownEpisodes, heldAtLeast, underwater } from '../../../tmobile/src/drawdowns';
import { formatWeek } from '../../../tmobile/src/insiderFilters';
import useCloses from '../useCloses';
import { anchorOf, titleOf } from '../instruments';

/**
 * One instrument's drawdown panel. Its closes are imported only as the panel
 * nears the viewport, so the page never downloads fourteen series to show two.
 */
function InstrumentPanel({ instrument, hold }) {
  const [ref, near] = useInViewport({ rootMargin: '800px 0px' });
  const { status, closes } = useCloses(instrument.load, near);

  const series = useMemo(() => (closes
    ? { points: underwater(closes), episodes: drawdownEpisodes(closes) }
    : null), [closes]);
  const episodes = useMemo(
    () => (series ? heldAtLeast(series.episodes, hold.days) : []),
    [series, hold.days],
  );

  const id = anchorOf(instrument);
  const kicker = `${instrument.name} · ${formatWeek(instrument.first)} to `
    + `${formatWeek(instrument.last)} · ${instrument.sessions.toLocaleString('en-US')} closes`;

  if (!series) {
    return (
      <section ref={ref} className="tm-panel st-pending" id={id} aria-labelledby={`${id}-heading`}>
        <div className="tm-panel__head">
          <h2 className="tm-panel__title" id={`${id}-heading`}>{titleOf(instrument)}</h2>
          <p className="tm-panel__kicker">{kicker}</p>
        </div>
        <div className="st-placeholder" aria-hidden={status !== 'error'}>
          {status === 'error' && <p className="tm-panel__note">This series did not load. Reload the page to try again.</p>}
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
      hold={hold}
      subject={`${instrument.label} daily close`}
    />
  );
}

export default InstrumentPanel;
