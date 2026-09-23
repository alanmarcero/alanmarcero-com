import EnvelopeField from '../../matrix/src/graphics/EnvelopeField';
import WaveTrace from '../../opus5ios/src/graphics/WaveTrace.jsx';
import Demo from '../../opus5ios/src/Demo';
import { demoCopy, ordinal } from '../../matrix/src/lib/format';
import { BankFigure, BankThumbnail } from './BankFigure';
import { bankSizeLabel } from './lib/catalog';

function BankDemos({ bank }) {
  const demos = bank.audioDemo || [];
  if (demos.length === 0) return <span className="codex-label">No demo on file</span>;

  return demos.map((videoId, demoIndex) => (
    <Demo key={videoId} videoId={videoId} {...demoCopy(bank.name, demoIndex, demos.length)} />
  ));
}

function BankEntry({ bank, index, isCurrent, rowRef, onPreview }) {
  return (
    <li
      className="codex-entry"
      data-row={index}
      data-current={isCurrent ? 'true' : 'false'}
      ref={rowRef(index)}
      onMouseEnter={() => onPreview(index)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) onPreview(null);
      }}
      onFocusCapture={() => onPreview(index)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onPreview(null);
      }}
    >
      <div className="codex-entry__field" aria-hidden="true">
        <EnvelopeField
          seed={bank.name}
          count={bank.count || 64}
          aspect={4.5}
          cellWidth={9}
          cellHeight={7}
          gap={2}
        />
      </div>
      <p className="codex-entry__index">{ordinal(index)}</p>
      <div className="codex-entry__body">
        <h3>
          <span>{bank.name}</span>
          <span className="codex-entry__leader" aria-hidden="true" />
          <span className="codex-entry__value">{bankSizeLabel(bank)}</span>
        </h3>
        <p className="codex-entry__description">{bank.description}</p>
        <BankThumbnail bank={bank} />
        <WaveTrace
          seed={bank.name}
          cycles={2}
          className="codex-entry__trace"
        />
        <div className="codex-entry__actions">
          <a
            className="codex-action"
            href={bank.downloadLink}
            download
            aria-label={`Download the bank — ${bank.name}`}
          >
            Download the bank
          </a>
          <BankDemos bank={bank} />
        </div>
      </div>
    </li>
  );
}

function Register({ banks, query, rowRef, activeIndex, onPreview }) {
  const currentBank = banks[activeIndex] || banks[0];

  return (
    <section className="codex-register" id="patch-banks" aria-labelledby="codex-banks-title">
      <div className="codex-shell">
        <div className="codex-section-head">
          <h2 id="codex-banks-title">Patch banks</h2>
          <p className="codex-label">Register · {banks.length} entries · free downloads</p>
        </div>
        <p className="codex-section-note">
          Load them straight into the instrument. Every bank is free, and free
          to use in whatever you make with it.
        </p>

        {banks.length === 0 ? (
          <p className="codex-state">
            Nothing in the catalogue matches &ldquo;{query}&rdquo;. Try another
            instrument or track name.
          </p>
        ) : (
          <div className="codex-register__layout">
            <ol className="codex-register__rows">
              {banks.map((bank, index) => (
                <BankEntry
                  key={bank.downloadLink}
                  bank={bank}
                  index={index}
                  isCurrent={index === activeIndex}
                  rowRef={rowRef}
                  onPreview={onPreview}
                />
              ))}
            </ol>

            {currentBank && (
              <aside className="codex-register__bench">
                <BankFigure key={currentBank.name} bank={currentBank} />
              </aside>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Register;
