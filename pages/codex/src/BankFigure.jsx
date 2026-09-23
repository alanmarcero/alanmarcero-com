import FaceplatePlan from '../../opus5ios/src/graphics/FaceplatePlan';
import WaveTrace from '../../opus5ios/src/graphics/WaveTrace.jsx';
import Line from '../../opus-max-mac/src/Line';
import { sourceFor, srcSetFor } from '../../opus5ios/src/data/synthImages';
import { bankSizeLabel, imageFor } from './lib/catalog';

function BankPhoto({ image, sizes, lazy = false }) {
  return (
    <img
      src={sourceFor(image)}
      srcSet={srcSetFor(image)}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={lazy ? 'lazy' : undefined}
      decoding="async"
    />
  );
}

/** Wraps a photograph in a link to where it came from, when the image asks for one. */
function SourceLink({ image, bankName, className, children }) {
  return (
    <a
      className={className}
      href={image.source}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${bankName} on ${image.sourceName || 'its source site'}`}
    >
      {children}
    </a>
  );
}

/** The bench's large figure for whichever row is being read. */
export function BankFigure({ bank }) {
  const image = imageFor(bank.name);
  const visual = (
    <div className="codex-bank-figure__visual">
      {image ? (
        <BankPhoto image={image} sizes="(max-width: 62rem) 72vw, 24rem" />
      ) : (
        <FaceplatePlan seed={bank.name} />
      )}
      <div className="codex-bank-figure__scope" aria-hidden="true">
        <WaveTrace seed={bank.name} cycles={2} />
      </div>
    </div>
  );

  return (
    <figure className="codex-bank-figure">
      {image?.linkImage ? (
        <SourceLink image={image} bankName={bank.name} className="codex-bank-figure__link">
          {visual}
        </SourceLink>
      ) : visual}
      <figcaption>
        <p className="codex-label">Current instrument</p>
        <p className="codex-bank-figure__name">{bank.name}</p>
        <div className="codex-bank-figure__readout">
          <Line value={bankSizeLabel(bank)}>Catalogue entry</Line>
          <Line value={`${(bank.audioDemo || []).length} on file`}>Audio demos</Line>
        </div>
      </figcaption>
    </figure>
  );
}

/** Each row's own small photograph, shown where the bench is not. */
export function BankThumbnail({ bank }) {
  const image = imageFor(bank.name);
  if (!image) return null;

  const picture = <BankPhoto image={image} sizes="(max-width: 62rem) 80vw, 1px" lazy />;

  if (!image.linkImage) {
    return <div className="codex-entry__thumbnail">{picture}</div>;
  }

  return (
    <SourceLink image={image} bankName={bank.name} className="codex-entry__thumbnail">
      {picture}
    </SourceLink>
  );
}
