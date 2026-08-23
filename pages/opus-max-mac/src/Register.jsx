import { useEffect } from 'react';
import useMediaQuery from '../../../src/hooks/useMediaQuery';
import useNearestRow from './hooks/useNearestRow';
import Line from './Line';
import Eyepiece from './Eyepiece';
import Plate from './Plate';

/*
 * The register — eleven banks as eleven rows you run down.
 *
 * Not eleven stacked blocks each with its own picture. One instrument sits
 * beside the register instead, and it shows whichever row you are reading: the
 * photograph, the designation, the interval, the magnitude and the count. That
 * puts one large plate on the page instead of eleven small ones, loads one
 * photograph instead of eight, and gives the reader a bench rather than a feed.
 *
 * On a narrow screen there is nowhere to park a bench, so each row carries its
 * own figure — gated on a media query rather than on CSS, because a display:
 * none <img> is still an <img> the browser fetches.
 */

const WIDE = '(min-width: 62rem)';

/**
 * What the bench prints beside the plate. Absent figures are said to be absent.
 *
 * Magnitude is not among them. It is computed from the patch count, and printing
 * it a line above the count it comes from reads as two measurements where there
 * is one — and seven of the eleven banks would print the same 2.0 anyway. It
 * stays inside the figure, where size and brightness already carry it.
 */
const readout = (bank, body) => [
  { label: 'Designation', value: body.designation },
  { label: 'Interval', value: `${body.interval.label} · ${body.interval.cents}¢` },
  { label: 'Patches', value: bank.count ? String(bank.count) : 'MIDI files' },
];

function Register({ banks, bodyFor, query, onCurrentChange }) {
  const isWide = useMediaQuery(WIDE);
  const [rowRef, activeIndex] = useNearestRow(banks.length);

  const activeBank = banks[activeIndex] ?? banks[0];
  const activeBody = activeBank ? bodyFor(activeBank) : null;

  // Reported upward so the orrery can light the ring belonging to the row being
  // read. It is the bank's place in the whole catalogue that goes up, not its
  // place in the filtered list — the orrery always draws all eleven.
  useEffect(() => {
    onCurrentChange?.(activeBody ? activeBody.index : null);
  }, [activeBody, onCurrentChange]);

  // tabIndex is what makes the skip link work. Without it the browser scrolls
  // here and leaves focus on <body>, so the next Tab goes back to the top of
  // the page — the link looks right and does nothing for the keyboard user it
  // exists for.
  return (
    <section className="register" id="register" tabIndex={-1} aria-labelledby="register-title">
      <div className="page">
        <div className="section-head">
          <h2 className="section-title" id="register-title">Patch banks</h2>
          <p className="gloss">Register · {banks.length} entries · free</p>
        </div>

        <p className="section-note prose">
          Patches for the machines below, and the MIDI files from the demos. All free to
          download, and free to use in whatever you make with them.
        </p>

        {banks.length === 0 && (
          <p className="state">
            Nothing in the register matches &ldquo;{query}&rdquo;. Try the
            instrument&rsquo;s name — Nord, Virus, Prophet, Moog, JP-8000.
          </p>
        )}

        {banks.length > 0 && (
          <div className="register__body">
            <ol className="register__rows">
              {banks.map((bank, index) => {
                const body = bodyFor(bank);
                const demos = bank.audioDemo || [];

                return (
                  <li
                    className="entry"
                    key={bank.downloadLink}
                    data-row={index}
                    data-current={index === activeIndex ? 'true' : 'false'}
                    ref={rowRef(index)}
                  >
                    <p className="entry__designation gloss">{body.designation}</p>

                    <h3 className="entry__name">
                      <Line value={bank.count ? `${bank.count} patches` : 'MIDI files'}>
                        {bank.name}
                      </Line>
                    </h3>

                    <p className="entry__text">{bank.description}</p>

                    {!isWide && (
                      <div className="entry__plate">
                        <Plate bank={bank} variant={body.index} sizes="62vw" />
                      </div>
                    )}

                    <div className="act-stack entry__acts">
                      <Line
                        as="a"
                        value="Zip"
                        href={bank.downloadLink}
                        download
                        aria-label={`Download the ${bank.name} bank`}
                      >
                        Download
                      </Line>

                      {demos.map((videoId, demoIndex) => (
                        <Eyepiece
                          key={videoId}
                          videoId={videoId}
                          value={demos.length > 1 ? `Demo ${demoIndex + 1}` : 'Demo'}
                          cue={demos.length > 1 ? `Hear demo ${demoIndex + 1}` : 'Hear it'}
                          label={
                            demos.length > 1
                              ? `Hear ${bank.name}, demo ${demoIndex + 1} of ${demos.length}`
                              : `Hear ${bank.name}`
                          }
                          subject={
                            demos.length > 1
                              ? `${bank.name}, demo ${demoIndex + 1}`
                              : bank.name
                          }
                        />
                      ))}

                      {/* Three banks have no demo — the JP-08, CODEX and the MIDI
                          collection. Saying so beats a row that just stops. */}
                      {demos.length === 0 && (
                        <p className="gloss gloss--quiet entry__absent">No demo on file</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {isWide && activeBank && activeBody && (
              <div className="bench">
                <div className="bench__inner">
                  <Plate bank={activeBank} variant={activeBody.index} />
                  <div className="bench__readout">
                    {readout(activeBank, activeBody).map((row) => (
                      <Line key={row.label} value={row.value}>{row.label}</Line>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Register;
export { readout };
