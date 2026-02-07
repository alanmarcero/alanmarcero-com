import { useState } from 'react';
import './App.css';
import Hero from './components/Hero';
import PatchBankItem from './components/PatchBankItem';
import MusicItem from './components/MusicItem';
import SkeletonCard from './components/SkeletonCard';
import BackToTop from './components/BackToTop';
import NoResults from './components/NoResults';
import Footer from './components/Footer';
import useMusicItems from './hooks/useMusicItems';
import { patchBanks as patchBanksData } from './data/patchBanks';
import { PAYPAL_DONATE_URL } from './config';

const SKELETON_COUNT = 3;

const createSearchFilter = (query, ...fields) => (entry) => {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  const searchableText = fields.map(field => entry[field] || '').join(' ').toLowerCase();
  return searchableText.includes(lowerQuery);
};

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const { musicItems, musicLoading, musicError } = useMusicItems();

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

      <section id="store">
        <h2 className="section-title">Patch Banks</h2>
        <div className="content-grid">
          {filteredPatchBanks.map((bank, index) => (
            <PatchBankItem key={bank.downloadLink} bank={bank} style={{ '--card-index': index }} />
          ))}
        </div>
      </section>

      <section id="music-remixes" className="section--alt">
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

      <section id="donate">
        <h2 className="section-title">Support My Work</h2>
        <p>If you enjoy the patches and music, consider supporting me via the following:</p>
        <a
          href={PAYPAL_DONATE_URL}
          className="btn-primary paypal-button"
          target="_blank"
          rel="noopener"
        >
          Donate via PayPal
        </a>
      </section>

      <Footer />
      <BackToTop />
    </>
  );
}

export default App;
