import EnvelopeField from '../graphics/EnvelopeField';
import YouTubeFacade from '../YouTubeFacade';

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

      {banks.map((bank, index) => (
        <article
          key={bank.downloadLink}
          className={`plate ${index % 2 === 1 ? 'plate--raised' : ''}`}
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

          <div className="shell plate__body entry">
            <h3 className="entry__name">{bank.name}</h3>
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
                aria-label={`Download the ${bank.name} bank`}
              >
                Download the bank
              </a>

              {(bank.audioDemo || []).map((videoId, index, demos) => (
                <YouTubeFacade
                  key={videoId}
                  videoId={videoId}
                  cue={demos.length > 1 ? `Demo ${index + 1}` : 'Hear it'}
                  label={
                    demos.length > 1
                      ? `Hear ${bank.name}, demo ${index + 1} of ${demos.length}`
                      : `Hear ${bank.name}`
                  }
                />
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export default PatchBanks;
