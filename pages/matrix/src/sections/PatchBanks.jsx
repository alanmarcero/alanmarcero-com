import './patchbanks.css';
import EnvelopeField from '../graphics/EnvelopeField';
import YouTubeFacade from '../YouTubeFacade';
import { imageFor, photoBrightnessFor } from '../data/synthImages';

/**
 * A bank's name reduced to something usable as a DOM id. Names carry
 * commas, slashes and spaces ("Roland JP-8000, JP-8080, JE-8086, and
 * Airwave"), none of which belong in an id referenced by aria-labelledby.
 */
export const headingIdFor = (name) =>
  `bank-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

/**
 * How many machines a bank actually covers.
 *
 * This is the catalog's own promise made countable. The section exists so
 * a reader can "find your instrument", and until now no row said which
 * instruments it covered: the title names one or two ("Sequential Prophet
 * 08 and Rev2") and the rest live inside description prose, where nobody
 * scanning eleven rows will find them. Someone who owns a Mopho, a Tetra,
 * an OsTIrus or a JE-8086 could not see that this site has patches for it.
 *
 * Coverage is also the honest basis for hierarchy. Eleven rows currently
 * sit within 16% of one height, so a bank spanning five machines with two
 * audio demos reads exactly like a MIDI zip. Weighting by coverage is not
 * an invented importance — it is the number of readers a row can serve.
 */
const coverageOf = (bank) => (bank.instruments || []).length;

/* The top step of the mass scale in patchbanks.css. That scale enumerates
   0..5 and nothing above, so the raw count must not be handed to CSS: a
   sixth instrument on the widest bank matches NO bucket, falls through to
   .plate__body's default padding, and renders TIGHTER than a bank with
   three. That is the inverted hierarchy the same CSS block already
   documents itself getting wrong once — arriving a second time by a
   different route.

   Measured 2026-08-30, per-bank instrument counts: [5 2 4 1 1 4 2 4 1 1].
   Max is 5 and the scale tops out at 5, so the cliff is ONE instrument
   away, and adding one is the most ordinary edit this data ever takes.

   The CSS says thresholds live in one place "so adding a BANK cannot
   silently land it in a bucket nobody chose." True, and it protects the
   wrong axis: adding a bank is safe at any count, adding an INSTRUMENT to
   the largest bank is what falls off the scale.

   Clamping here rather than widening the CSS is deliberate. data-coverage
   is a BUCKET SELECTOR, not a readout — the honest number is rendered as
   text ("Fits 5 instruments") from `coverage`, which stays unclamped. The
   attribute should be total over the scale by construction rather than
   asking a future editor to remember a sixth rule.

   To add a sixth step: raise this AND add the bucket. The test in
   PatchBanks.test.jsx fails if the two ever disagree. */
const COVERAGE_SCALE_TOP = 5;
const coverageBucketOf = (bank) => Math.min(coverageOf(bank), COVERAGE_SCALE_TOP);

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
        const coverage = coverageOf(bank);

        /* Per-image exposure correction, the middle link of a three-slice
           contract: the measurements live with the image data, the filter
           lives in the shared surface, and this passes one between them.
           Eight Wikimedia photographs by eight photographers ran 1.44:1 to
           4.89:1 against the ground after a single uniform filter — a 3.4x
           spread that no single filter value can close, because tuning
           moves all eight together.

           MUST be undefined and never null or '' when unmeasured. React
           omits an undefined style value, so the shared rule falls back to
           var(--photo-brightness, 1) and renders byte-identically to
           before. An empty string instead emits `--photo-brightness: `,
           which makes calc(0.86 * ) invalid, drops the whole filter
           declaration, and ships the photo completely unfiltered. */
        const photoBrightness = photoBrightnessFor(bank.name);

        return (
          <article
            key={bank.downloadLink}
            className={`plate ${index % 2 === 1 ? 'plate--raised' : ''}`}
            /* Mass follows coverage. CSS reads this rather than a tier name
               so the thresholds stay in one place and adding a bank cannot
               land it in a bucket nobody chose. Clamped to the scale's top
               step — see COVERAGE_SCALE_TOP; the unclamped `coverage` is
               what the "Fits N instruments" readout below reports. */
            data-coverage={coverageBucketOf(bank)}
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
              <figure
                className="entry__photo"
                style={{ '--photo-brightness': photoBrightness }}
              >
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

            {/* The machines this bank loads onto, as data rather than prose.
                A real list, because it is one — and labelled, so a screen
                reader hears "fits 5 instruments" before the names instead of
                five bare nouns after a paragraph. Entries with no
                instruments (the MIDI bank) render nothing at all. */}
            {coverage > 0 && (
              <div className="entry__fits">
                <span className="legend entry__fits-label" id={`${headingId}-fits`}>
                  Fits {coverage} {coverage === 1 ? 'instrument' : 'instruments'}
                </span>
                <ul className="entry__instruments" aria-labelledby={`${headingId}-fits`}>
                  {bank.instruments.map((instrument) => (
                    <li key={instrument} className="entry__instrument">{instrument}</li>
                  ))}
                </ul>
              </div>
            )}

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
