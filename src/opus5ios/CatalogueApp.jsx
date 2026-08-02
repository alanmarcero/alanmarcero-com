import { useState } from 'react';
import './styles/paper.css';
import './styles/broadsheet.css';
import Masthead from './Masthead';
import Catalogue from './Catalogue';
import Releases from './Releases';
import Colophon from './Colophon';
import useReleases from './hooks/useReleases';
import { patchBanks } from '../data/patchBanks';

const TOTAL_PATCHES = patchBanks.reduce((sum, bank) => sum + (bank.count || 0), 0);
const INSTRUMENT_COUNT = patchBanks.filter((bank) => bank.count).length;

const matches = (query, ...fields) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((field) => (field || '').toLowerCase().includes(needle));
};

/**
 * /opus5ios — the catalogue sheet.
 *
 * One search box narrows both sections at once, because "Nord" is a
 * reasonable thing to type whether you want the patches or the tracks made
 * with them.
 */
function CatalogueApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const { items, loading, error } = useReleases();
  const [visibleReleases, setVisibleReleases] = useState(0);

  const visibleBanks = patchBanks.filter(
    (bank) => matches(searchQuery, bank.name, bank.description),
  );
  const visibleItems = items.filter(
    (item) => matches(searchQuery, item.title, item.description),
  );

  return (
    <>
      <a className="skip-link" href="#catalogue-heading">Skip to the catalogue</a>

      <Masthead
        totalPatches={TOTAL_PATCHES}
        instrumentCount={INSTRUMENT_COUNT}
        releaseCount={items.length}
      />

      <main>
        <div className="sheet">
          <div className="finder">
            <label className="legend" htmlFor="find-instrument">
              Find an instrument or a track
            </label>
            <input
              id="find-instrument"
              className="finder__input"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Nord, Virus, trance…"
              autoComplete="off"
              spellCheck="false"
            />
            <p className="finder__result" role="status">
              {searchQuery
                ? `${visibleBanks.length} banks · ${visibleReleases} releases`
                : ''}
            </p>
          </div>
        </div>

        <Catalogue banks={visibleBanks} searchQuery={searchQuery} />

        <Releases
          items={visibleItems}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          onVisibleCountChange={setVisibleReleases}
        />
      </main>

      <Colophon />
    </>
  );
}

export default CatalogueApp;
