import { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';
import Hero from './components/Hero';
import PatchBankItem from './components/PatchBankItem';
import MusicItem from './components/MusicItem';
import SkeletonCard from './components/SkeletonCard';
import BackToTop from './components/BackToTop';
import NoResults from './components/NoResults';
import Footer from './components/Footer';
import Toast from './components/Toast';
import useMusicItems from './hooks/useMusicItems';
import useScrollReveal from './hooks/useScrollReveal';
import { patchBanks as patchBanksData } from './data/patchBanks';
import { TOAST_DISMISS_MS } from './config';

const SKELETON_COUNT = 3;

const createSearchFilter = (query, ...fields) => (item) => {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  const searchableText = fields.map(field => item[field] || '').join(' ').toLowerCase();
  return searchableText.includes(lowerQuery);
};

const revealClass = (isVisible, extra = '') =>
  `${extra ? extra + ' ' : ''}scroll-reveal${isVisible ? ' scroll-reveal--visible' : ''}`;

const readSearchFromUrl = () => {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('q') || '';
};

function App() {
  const [searchQuery, setSearchQuery] = useState(readSearchFromUrl);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const { musicItems, musicLoading, musicError } = useMusicItems();

  const [storeRef, storeVisible] = useScrollReveal();
  const [musicRef, musicVisible] = useScrollReveal();
  const showToast = useCallback((message) => {
    clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DISMISS_MS);
  }, []);

  // Sync ?q= query param with searchQuery state (preserves anchors).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const current = params.get('q') || '';
    if (searchQuery === current) return;
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? '?' + qs : ''}${window.location.hash}`;
    window.history.replaceState(null, '', next);
  }, [searchQuery]);

  // Restore searchQuery from URL when back/forward navigation fires popstate.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onPopstate = () => setSearchQuery(readSearchFromUrl());
    window.addEventListener('popstate', onPopstate);
    return () => window.removeEventListener('popstate', onPopstate);
  }, []);

  const filteredPatchBanks = patchBanksData.filter(createSearchFilter(searchQuery, 'name', 'description'));
  const filteredMusicItems = musicItems.filter(createSearchFilter(searchQuery, 'title', 'description'));

  const hasNoResults = searchQuery
    && filteredPatchBanks.length === 0
    && filteredMusicItems.length === 0
    && !musicLoading;

  const resultsCount = searchQuery
    ? { patches: filteredPatchBanks.length, music: filteredMusicItems.length }
    : null;

  return (
    <>
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <Hero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultsCount={resultsCount}
      />

      <main id="main-content">
        {hasNoResults && <NoResults query={searchQuery} />}

        <section
          id="store"
          ref={storeRef}
          className={revealClass(storeVisible)}
          aria-labelledby="store-heading"
        >
          <h2 id="store-heading" className="section-title">Patch Banks</h2>
          <div className="content-grid">
            {filteredPatchBanks.map((bank, index) => (
              <PatchBankItem
                key={bank.downloadLink}
                bank={bank}
                style={{ '--card-index': index }}
                onDownload={() => showToast('Downloading now...')}
              />
            ))}
          </div>
        </section>

        <section
          id="music-remixes"
          ref={musicRef}
          className={revealClass(musicVisible)}
          aria-labelledby="music-heading"
        >
          <h2 id="music-heading" className="section-title">Music and Remixes</h2>
          <div className="content-grid">
            {musicLoading && Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
            {musicError && <p className="error-message">Unable to load music. Please try again later.</p>}
            {!musicLoading && !musicError && filteredMusicItems.map((item, index) => (
              <MusicItem key={item.videoId} item={item} style={{ '--card-index': index }} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <BackToTop />
      <Toast message={toast} visible={!!toast} />
    </>
  );
}

export default App;
