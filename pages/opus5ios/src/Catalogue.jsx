import Demo from './Demo';
import WaveTrace from './graphics/WaveTrace.jsx';
import FaceplatePlan from './graphics/FaceplatePlan';
import { imageFor, srcSetFor, sourceFor } from './data/synthImages';

const plateNumber = (index) => String(index + 1).padStart(2, '0');

/**
 * One plate per instrument.
 *
 * A plate is three columns and two hairlines: the number, the machine, the
 * figure. It is not a card — nothing here has a background, a border on
 * more than one side, a corner radius or a shadow, and the row is
 * separated from its neighbour by the same 1px rule the rest of the sheet
 * uses. The photographs sit in the third column and the scope trace sits
 * under them, so the eye can run down either column on its own.
 */
function Catalogue({ banks, searchQuery }) {
  return (
    <section className="catalogue sheet" aria-labelledby="catalogue-heading">
      <div className="section-head">
        <h2 id="catalogue-heading" className="section-title">Patch banks</h2>
        <p className="legend">Fig. 1 &mdash; {banks.length} plates &middot; free downloads</p>
      </div>

      <p className="section-note prose">
        Load them straight into the instrument. Every bank is free, and free
        to use in whatever you make with it.
      </p>

      {banks.length === 0 && (
        <p className="state">
          Nothing in the catalogue matches &ldquo;{searchQuery}&rdquo;. Try the
          instrument&rsquo;s name &mdash; Nord, Virus, Prophet, Moog, JP-8000.
        </p>
      )}

      {banks.map((bank, index) => {
        const image = imageFor(bank.name);
        const demos = bank.audioDemo || [];

        return (
          <article className="entry" key={bank.downloadLink}>
            <p className="entry__index">{plateNumber(index)}</p>

            <div className="entry__body">
              <h3 className="entry__name">{bank.name}</h3>
              <p className="entry__text">{bank.description}</p>

              <p className="entry__spec">
                {/* The MIDI bank has no patch count, and a bare "patches"
                    label under an empty readout is worse than no readout. */}
                {bank.count ? (
                  <>
                    <span className="readout entry__count">{bank.count}</span>
                    <span className="legend">patches</span>
                  </>
                ) : (
                  <span className="legend">MIDI files</span>
                )}
                <span className="legend">
                  {demos.length
                    ? `${demos.length} audio demo${demos.length > 1 ? 's' : ''}`
                    : 'No demo on file'}
                </span>
                <span className="legend legend--blue">Free</span>
              </p>

              <div className="entry__actions">
                <a
                  className="action action--download"
                  href={bank.downloadLink}
                  download
                  aria-label={`Download the ${bank.name} bank`}
                >
                  Download
                </a>
                {demos.map((videoId, demoIndex) => (
                  <Demo
                    key={videoId}
                    videoId={videoId}
                    cue={demos.length > 1 ? `Demo ${demoIndex + 1}` : 'Hear it'}
                    label={
                      demos.length > 1
                        ? `Hear ${bank.name}, demo ${demoIndex + 1} of ${demos.length}`
                        : `Hear ${bank.name}`
                    }
                  />
                ))}
              </div>
            </div>

            <div className="entry__figure">
              {image ? (
                <figure className="entry__photo">
                  <img
                    src={sourceFor(image)}
                    srcSet={srcSetFor(image)}
                    sizes="(max-width: 52rem) 100vw, 24rem"
                    width={image.width}
                    height={image.height}
                    alt={image.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ) : (
                /* No photograph of this one exists — see faceplate.js. The
                   drawn plan is honest about being a drawing, which a
                   substituted lookalike photograph would not be. */
                <figure className="entry__plan">
                  <FaceplatePlan seed={bank.name} />
                </figure>
              )}
              <WaveTrace seed={bank.name} cycles={2} />
              <p className="entry__caption">
                {image ? 'Photograph · ' : 'Plan view, drawn · '}
                Oscillator trace, two cycles
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default Catalogue;
