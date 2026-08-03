import { useState } from 'react';
import './styles/dusk.css';
import './styles/ephemeris.css';
import Frontispiece from './Frontispiece';
import Finder from './Finder';
import Register from './Register';
import Tracklist from './Tracklist';
import Imprint from './Imprint';
import usePlaylist from './hooks/usePlaylist';
import { orbitsFor } from './graphics/orbits';
import { patchBanks } from '../data/patchBanks';

/*
 * /opus-max-mac — an ephemeris of the work.
 *
 * One search narrows both the register and the log, because "Nord" is a
 * reasonable thing to type whether you want the patches or the tracks made
 * with them.
 */

const TOTAL_PATCHES = patchBanks.reduce((sum, bank) => sum + (bank.count || 0), 0);

/*
 * The orbital elements are computed once, from the WHOLE catalogue, and looked
 * up by bank. Deriving them from the filtered list instead would re-designate
 * every bank the moment someone typed in the search box — entry VII would
 * become entry II and its interval would change with it. A designation that
 * moves is not a designation.
 */
const BODY_LIST = orbitsFor(patchBanks);
const BODIES = new Map(BODY_LIST.map((body) => [body.bank.name, body]));
const bodyFor = (bank) => BODIES.get(bank.name);

const matches = (query, ...fields) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return fields.some((field) => (field || '').toLowerCase().includes(needle));
};

function AlmanacApp() {
  const [query, setQuery] = useState('');
  // Which ring the orrery lights: the register reports the row being read, and
  // the figure draws it. The two are far apart on the page, so what this mostly
  // buys is that scrolling back up finds the last bank you looked at still lit.
  const [currentBank, setCurrentBank] = useState(null);
  const { items, loading, error } = usePlaylist();

  const banks = patchBanks.filter((bank) => matches(query, bank.name, bank.description));
  const tracks = items.filter((track) => matches(query, track.title));

  return (
    <>
      <a className="skip-link" href="#register">Skip to the patch banks</a>

      <Frontispiece
        banks={patchBanks}
        bodies={BODY_LIST}
        totalPatches={TOTAL_PATCHES}
        releaseCount={loading || error ? null : items.length}
        currentBank={currentBank}
      />

      <main>
        <Finder
          query={query}
          onQueryChange={setQuery}
          bankCount={banks.length}
          trackCount={loading || error ? null : tracks.length}
        />

        <Register
          banks={banks}
          bodyFor={bodyFor}
          query={query}
          onCurrentChange={setCurrentBank}
        />

        <Tracklist tracks={tracks} loading={loading} error={error} query={query} />
      </main>

      <Imprint />
    </>
  );
}

export default AlmanacApp;
export { TOTAL_PATCHES, bodyFor, matches };
