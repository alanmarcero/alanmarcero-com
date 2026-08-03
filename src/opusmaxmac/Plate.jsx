import Aperture from './graphics/Aperture';
import AiryDisc from './graphics/AiryDisc';
import { plateFor, srcSetFor, sourceFor } from './data/plates';

/**
 * The figure for one bank: a photograph through a circular aperture, or — when
 * there is no photograph — the pattern a telescope actually makes of a source
 * it cannot resolve.
 *
 * Three banks have no freely-licensed photograph anywhere and must never be
 * given a lookalike: the SH-01A (none exists), Waves CODEX (a plugin) and the
 * MIDI collection (not an instrument). An Airy diffraction pattern cannot be
 * mistaken for a photograph of a machine that does not exist. A substituted
 * SH-101 shot could.
 *
 * Which banks those are is read off the photograph set, never hardcoded — and
 * note it is NOT the same three banks that have no audio demo. The SH-01A has
 * a demo and no photograph; the JP-08 has a photograph and no demo.
 */
function Plate({ bank, variant = 0, sizes = '(max-width: 62rem) 62vw, 24rem' }) {
  const photograph = plateFor(bank.name);

  if (!photograph) {
    return (
      <figure className="plate-figure">
        <AiryDisc variant={variant} />
        <figcaption className="gloss gloss--quiet plate-figure__caption">
          No photograph on file — drawn as an Airy pattern, the image a telescope makes
          of a source it cannot resolve
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="plate-figure">
      <Aperture
        src={sourceFor(photograph)}
        srcSet={srcSetFor(photograph)}
        sizes={sizes}
        width={photograph.width}
        height={photograph.height}
        alt={photograph.alt}
      />
      <figcaption className="gloss gloss--quiet plate-figure__caption">
        Photograph · {photograph.author} · {photograph.licence}
      </figcaption>
    </figure>
  );
}

export default Plate;
