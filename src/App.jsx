import { useState, useRef, useCallback } from 'react';
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
import { PAYPAL_DONATE_URL } from './config';

const SKELETON_COUNT = 3;

const createSearchFilter = (query, ...fields) => (item) => {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  const searchableText = fields.map(field => item[field] || '').join(' ').toLowerCase();
  return searchableText.includes(lowerQuery);
};

const revealClass = (isVisible, extra = '') =>
  `${extra ? extra + ' ' : ''}scroll-reveal${isVisible ? ' scroll-reveal--visible' : ''}`;

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const { musicItems, musicLoading, musicError } = useMusicItems();

  const [storeRef, storeVisible] = useScrollReveal();
  const [musicRef, musicVisible] = useScrollReveal();
  const [donateRef, donateVisible] = useScrollReveal();

  const showToast = useCallback((message) => {
    clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const filteredPatchBanks = patchBanksData.filter(createSearchFilter(searchQuery, 'name', 'description'));
  const filteredMusicItems = musicItems.filter(createSearchFilter(searchQuery, 'title', 'description'));

  const hasNoResults = searchQuery
    && filteredPatchBanks.length === 0
    && filteredMusicItems.length === 0
    && !musicLoading;

  return (
    <>
      <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {hasNoResults && <NoResults query={searchQuery} />}

      <section
        id="donate"
        ref={donateRef}
        className={revealClass(donateVisible)}
      >
        <h2 className="section-title">Support My Work</h2>
        <p>Every patch bank is free. If they help your music, consider giving back:</p>
        <a
          href={PAYPAL_DONATE_URL}
          className="btn-primary paypal-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Donate via PayPal
        </a>
      </section>

      <section
        id="store"
        ref={storeRef}
        className={revealClass(storeVisible)}
      >
        <h2 className="section-title">Patch Banks</h2>
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
      >
        <h2 className="section-title">Music and Remixes</h2>
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

      <Footer />
      <BackToTop />
      <Toast message={toast} visible={!!toast} />
    </>
  );
}

export default App;
