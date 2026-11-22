import DrawdownChart from './DrawdownChart';
import DrawdownTable from './DrawdownTable';
import { describeHold, formatDepth } from '../drawdowns';

/**
 * One instrument's drawdowns: the underwater chart and the table that is its
 * accessible twin. `children` sit between the heading and the chart — a page
 * with one chart puts its control there.
 */
function DrawdownPanel({
  id, title, kicker, points, episodes, hold, subject, children,
}) {
  const holdLabel = describeHold(hold);
  const worst = episodes.reduce(
    (deep, e) => (!deep || e.depth < deep.depth ? e : deep),
    null,
  );
  const latest = points[points.length - 1];

  return (
    <>
      <section className="dd-panel" id={id} aria-labelledby={`${id}-heading`}>
        <div className="dd-panel__head">
          <div>
            <h2 className="dd-panel__title" id={`${id}-heading`}>{title}</h2>
            {kicker && <p className="dd-panel__kicker">{kicker}</p>}
          </div>
          {(worst || latest) && (
            <div className="dd-panel__stats">
              {worst && (
                <span className="dd-stat">
                  <span className="dd-stat__label">Max</span>
                  <strong className="dd-stat__val dd-stat__val--max">{formatDepth(worst.depth)}</strong>
                </span>
              )}
              {latest && (
                <span className="dd-stat">
                  <span className="dd-stat__label">Now</span>
                  <strong className={`dd-stat__val${latest.depth < 0 ? ' dd-stat__val--dd' : ' dd-stat__val--ath'}`}>
                    {latest.depth < 0 ? formatDepth(latest.depth) : 'ATH'}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>

        {children}

        <DrawdownChart points={points} episodes={episodes} subject={subject} />
      </section>

      <DrawdownTable episodes={episodes} holdLabel={holdLabel} />
    </>
  );
}

export default DrawdownPanel;
