import { useState, useEffect } from 'react';
import './App.css';
import Hero from './components/Hero';
import PatchBankItem from './components/PatchBankItem';
import MusicItem from './components/MusicItem';
import SkeletonCard from './components/SkeletonCard';
import BackToTop from './components/BackToTop';
import NoResults from './components/NoResults';
import Footer from './components/Footer';
import { patchBanks as patchBanksData } from './data/patchBanks';
import { LAMBDA_URL, PAYPAL_DONATE_URL } from './config';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [musicItems, setMusicItems] = useState([]);
  const [musicLoading, setMusicLoading] = useState(true);
  const [musicError, setMusicError] = useState(null);

  useEffect(() => {
    fetch(LAMBDA_URL)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load music: ${response.status}`);
        return response.json();
      })
      .then(musicResponse => {
        setMusicItems(musicResponse.items ?? []);
      })
      .catch(error => {
        setMusicError(error.message);
      })
      .finally(() => {
        setMusicLoading(false);
      });
  }, []);

  const createSearchFilter = (...fields) => (entry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const searchableText = fields.map(fieldName => entry[fieldName] || '').join(' ').toLowerCase();
    return searchableText.includes(query);
  };

  const filteredPatchBanks = patchBanksData.filter(createSearchFilter('name', 'description'));
  const filteredMusicItems = musicItems.filter(createSearchFilter('title', 'description'));

  const hasNoResults = searchQuery
    && filteredPatchBanks.length === 0
    && filteredMusicItems.length === 0
    && !musicLoading;

  return (
    <>
      <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {hasNoResults && <NoResults query={searchQuery} />}

      {/* Patch Banks Section */}
      <section id="store">
        <h2 className="section-title">Patch Banks</h2>
        <div className="content-grid">
          {filteredPatchBanks.map((bank, index) => (
            <PatchBankItem key={bank.downloadLink} bank={bank} style={{ '--card-index': index }} />
          ))}
        </div>
      </section>

      {/* Music and Remixes Section */}
      <section id="music-remixes">
        <h2 className="section-title">Music and Remixes</h2>
        <div className="content-grid">
          {musicLoading && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
          {musicError && <p className="error-message">Unable to load music. Please try again later.</p>}
          {!musicLoading && !musicError && filteredMusicItems.map((item, index) => (
            <MusicItem key={item.videoId} item={item} style={{ '--card-index': index }} />
          ))}
        </div>
      </section>

      {/* Donate Section */}
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
