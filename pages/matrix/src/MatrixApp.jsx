import { useState } from 'react';
import './tokens.css';
import './layout.css';
import './matrix.css';
import Hero from './Hero';
import Footer from './Footer';
import PatchBanks from './sections/PatchBanks';
import Music from './sections/Music';
import { patchBanks } from '../../../src/data/patchBanks';
import { totalPatches, patchBandSizes, instrumentCount, matchesQuery } from './lib/catalog';

const TOTAL_PATCHES = totalPatches(patchBanks);

// Where one machine's patches end and the next begin, for the hero field.
// Derived from the same summand as TOTAL_PATCHES on purpose — see
// patchBandSizes. Static because the hero draws the whole catalog, not the
// search results: the field is the thesis, not a readout.
const PATCH_BAND_SIZES = patchBandSizes(patchBanks);

// Instruments, not banks. Ten banks cover twenty-four machines, so counting
// banks here understated the catalog by more than half in the hero's headline
// claim. See src/matrix/lib/catalog.js for why this is read from explicit
// data rather than parsed out of bank names.
const INSTRUMENT_COUNT = instrumentCount(patchBanks);

function MatrixApp() {
  const [searchQuery, setSearchQuery] = useState('');

  // null until the music section has actually settled. Distinguishing
  // "not known yet" from "none" is load-bearing: this value reaches a
  // live region in the hero, and 0 there is a false statement during a
  // cold fetch rather than a small inaccuracy.
  const [musicCount, setMusicCount] = useState(null);

  const visibleBanks = patchBanks.filter(
    (bank) => matchesQuery(searchQuery, bank.name, bank.description),
  );

  const resultsCount = searchQuery
    ? { patches: visibleBanks.length, music: musicCount }
    : null;

  return (
    <>
      <a className="skip-link" href="#catalog">Skip to the catalog</a>

      <Hero
        totalPatches={TOTAL_PATCHES}
        patchBandSizes={PATCH_BAND_SIZES}
        instrumentCount={INSTRUMENT_COUNT}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultsCount={resultsCount}
      />

      <main id="catalog">
        <PatchBanks banks={visibleBanks} searchQuery={searchQuery} />
        <Music searchQuery={searchQuery} onVisibleCountChange={setMusicCount} />
      </main>

      <Footer />
    </>
  );
}

export default MatrixApp;
