import DrawdownChart from './DrawdownChart';
import DrawdownTable from './DrawdownTable';
import { describeDrawdowns, describeHold, summarizeDrawdowns } from '../drawdowns';
import { formatPrice, formatWeek } from '../insiderFilters';

/**
 * One instrument's drawdowns: the underwater chart, the caption derived from
 * it, and the table that is its accessible twin. `children` sit between the
 * heading and the chart — a page with one chart puts its control there.
 */
function DrawdownPanel({
  id, title, kicker, points, episodes, hold, subject, children,
}) {
  const holdLabel = describeHold(hold);
  const caption = describeDrawdowns(summarizeDrawdowns(episodes), holdLabel, {
    formatDate: formatWeek, formatPrice,
  });

  return (
    <>
      <section className="tm-panel" id={id} aria-labelledby={`${id}-heading`}>
        <div className="tm-panel__head">
          <h2 className="tm-panel__title" id={`${id}-heading`}>{title}</h2>
          {kicker && <p className="tm-panel__kicker">{kicker}</p>}
        </div>

        {children}

        <DrawdownChart points={points} episodes={episodes} subject={subject} />

        <p className="tm-panel__note">{caption}</p>

        <p className="tm-hint">
          Hover or focus the chart and use &larr; &rarr; to step a week at a time.
        </p>
      </section>

      <DrawdownTable episodes={episodes} holdLabel={holdLabel} />
    </>
  );
}

export default DrawdownPanel;
