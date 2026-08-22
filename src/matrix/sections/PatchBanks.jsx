import EnvelopeField from '../graphics/EnvelopeField';
import YouTubeFacade from '../YouTubeFacade';
import { imageFor } from '../data/synthImages';

/**
 * A bank's name reduced to something usable as a DOM id. Names carry
 * commas, slashes and spaces ("Roland JP-8000, JP-8080, JE-8086, and
 * Airwave"), none of which belong in an id referenced by aria-labelledby.
 */
export const headingIdFor = (name) =>
  `bank-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

/**
 * The catalog. One plate per instrument, each carrying its own field of
 * envelopes — one glyph per patch in that bank, generated from the bank's
 * own name, so no two instruments share a texture.
 */
function PatchBanks({ banks, searchQuery }) {
  return (
    <section className="patch-banks" aria-labelledby="banks-heading">
      <div className="plate plate--head">
        <div className="shell plate__body">
          <div className="section-head">
            <h2 id="banks-heading" className="section-title">Patch banks</h2>
            <p className="legend legend--wide">Free downloads</p>
          </div>
          <p className="section-stat prose">
            Load them straight into the instrument. Every bank is free, and
            free to use in whatever you make with it.
          </p>
        </div>
      </div>

      {banks.length === 0 && (
        <div className="plate">
          <div className="shell plate__body">
            <p className="state">
              Nothing matches “{searchQuery}”. Try the instrument’s name —
              Nord, Virus, Prophet, Moog, JP-8000.
            </p>
          </div>
        </div>
      )}

      {banks.map((bank, index) => {
        const image = imageFor(bank.name);
        const headingId = headingIdFor(bank.name);

        return (
          <article
            key={bank.downloadLink}
            className={`plate ${index % 2 === 1 ? 'plate--raised' : ''}`}
            aria-labelledby={headingId}
          >
          <div className="plate__field">
            <EnvelopeField
              seed={bank.name}
              count={bank.count || 64}
              aspect={4.2}
              cellWidth={9}
              cellHeight={7}
              gap={2}
            />
          </div>

          <div className="shell plate__body entry entry--pictured">
            {image ? (
              <figure className="entry__photo">
                <img
                  src={`/synths/${image.slug}-960.webp`}
                  srcSet={`/synths/${image.slug}-480.webp 480w, /synths/${image.slug}-960.webp 960w`}
                  sizes="(max-width: 46rem) 100vw, 20rem"
                  width={image.width}
                  height={image.height}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            ) : (
              /* No photograph exists for this entry — the SH-01A has none
                 licensed for reuse, CODEX is a plugin, the MIDI bank is not
                 an instrument. Rather than leaving a hole and letting the
                 title jump to the gutter, the bank's own envelope field
                 steps forward and becomes the portrait. */
              <figure className="entry__photo entry__photo--field" aria-hidden="true">
                <EnvelopeField
                  seed={`${bank.name} portrait`}
                  count={bank.count || 48}
                  aspect={1.7}
                  cellWidth={10}
                  cellHeight={8}
                  gap={3}
                />
              </figure>
            )}

            <h3 id={headingId} className="entry__name">{bank.name}</h3>
            <p className="entry__desc">{bank.description}</p>

            {/* Not every entry is counted in patches — the MIDI bank has no
                count, and a bare "patches" label under an empty readout is
                worse than no readout at all. */}
            {bank.count ? (
              <p className="entry__meta">
                <span className="readout entry__count">{bank.count}</span>
                <span className="legend entry__unit">patches</span>
              </p>
            ) : (
              <p className="entry__meta">
                <span className="legend entry__unit">MIDI files</span>
              </p>
            )}

            <div className="entry__actions">
              <a
                className="action"
                href={bank.downloadLink}
                download
                /* WCAG 2.5.3 Label in Name: the accessible name must
                   CONTAIN the visible text. "Download the ${bank.name}
                   bank" splits the visible "Download the bank" around the
                   instrument, so a voice-control user saying "click
                   Download the bank" matches nothing. Suffixing keeps the
                   visible string intact and still gives all eleven links
                   distinct names. */
                aria-label={`Download the bank — ${bank.name}`}
              >
                Download the bank
              </a>

              {/* `cue` is the visible text and `label` becomes aria-label,
                  which OVERRIDES it — so every label here begins with its own
                  cue verbatim. The previous pair ("Hear it" / "Hear <name>")
                  dropped the word "it" from the accessible name and failed
                  WCAG 2.5.3 on all four single-demo banks. */}
              {(bank.audioDemo || []).map((videoId, demoIndex, demos) => (
                <YouTubeFacade
                  key={videoId}
                  videoId={videoId}
                  cue={demos.length > 1 ? `Demo ${demoIndex + 1}` : 'Hear it'}
                  label={
                    demos.length > 1
                      ? `Demo ${demoIndex + 1} of ${demos.length} — ${bank.name}`
                      : `Hear it — ${bank.name}`
                  }
                />
              ))}
            </div>
          </div>
          </article>
        );
      })}
    </section>
  );
}

export default PatchBanks;
