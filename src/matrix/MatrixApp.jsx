import { useState } from 'react';
import './tokens.css';
import './layout.css';
import './matrix.css';
import Hero from './Hero';
import Footer from './Footer';
import PatchBanks from './sections/PatchBanks';
import Music from './sections/Music';
import { patchBanks } from '../data/patchBanks';

const TOTAL_PATCHES = patchBanks.reduce((sum, bank) => sum + (bank.count || 0), 0);
const INSTRUMENT_COUNT = patchBanks.filter((bank) => bank.count).length;

const matches = (query, ...fields) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((field) => (field || '').toLowerCase().includes(needle));
};

function MatrixApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [musicCount, setMusicCount] = useState(0);

  const visibleBanks = patchBanks.filter(
    (bank) => matches(searchQuery, bank.name, bank.description),
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
