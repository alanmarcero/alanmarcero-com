import { useState } from 'react';
import './codex.css';
import { patchBanks } from '../../../src/data/patchBanks';
import useMusicItems from '../../../src/hooks/useMusicItems';
import useScrollProgress from '../../../src/hooks/useScrollProgress';
import useNearestRow from '../../opus-max-mac/src/hooks/useNearestRow';
import NoResults from '../../../src/components/NoResults';
import Hero from './Hero';
import Finder from './Finder';
import Register from './Register';
import Releases from './Releases';
import Colophon from './Colophon';
import { filterBanks, filterReleases } from './lib/catalog';

function CodexApp() {
  const [query, setQuery] = useState('');
  const [previewIndex, setPreviewIndex] = useState(null);
  const { musicItems, musicLoading, musicError } = useMusicItems();
  const scrollProgressRef = useScrollProgress();

  const banks = filterBanks(patchBanks, query);
  const releases = filterReleases(musicItems, query);
  const [rowRef, activeIndex] = useNearestRow(banks.length);
  const currentIndex = previewIndex ?? activeIndex;
  const hasNoResults = Boolean(query)
    && banks.length === 0
    && releases.length === 0
    && !musicLoading
    && !musicError;

  return (
    <div className="codex-page">
      <a className="codex-skip" href="#codex-main">Skip to the catalogue</a>
      <div
        ref={scrollProgressRef}
        className="codex-scroll-progress"
        aria-hidden="true"
      />
      <Hero />
      <main id="codex-main">
        <Finder
          query={query}
          onQueryChange={(nextQuery) => {
            setPreviewIndex(null);
            setQuery(nextQuery);
          }}
          bankCount={banks.length}
          releaseCount={musicLoading || musicError ? null : releases.length}
        />
        {hasNoResults ? (
          <div className="codex-empty codex-shell">
            <NoResults query={query} />
          </div>
        ) : (
          <>
            <Register
              banks={banks}
              query={query}
              rowRef={rowRef}
              activeIndex={currentIndex}
              onPreview={setPreviewIndex}
            />
            <Releases
              items={releases}
              loading={musicLoading}
              error={musicError}
              query={query}
            />
          </>
        )}
      </main>
      <Colophon />
    </div>
  );
}

export default CodexApp;
