import { useState } from 'react';
import './tokens.css';
import './layout.css';
import './matrix.css';
import Hero from './Hero';
import Footer from './Footer';
import PatchBanks from './sections/PatchBanks';
import Music from './sections/Music';
import { patchBanks } from '../data/patchBanks';
import { totalPatches, instrumentCount, matchesQuery } from './lib/catalog';

const TOTAL_PATCHES = totalPatches(patchBanks);

// Instruments, not banks. Ten banks cover twenty-four machines, so counting
// banks here understated the catalog by more than half in the hero's headline
// claim. See src/matrix/lib/catalog.js for why this is read from explicit
// data rather than parsed out of bank names.
const INSTRUMENT_COUNT = instrumentCount(patchBanks);

function MatrixApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [musicCount, setMusicCount] = useState(0);

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
