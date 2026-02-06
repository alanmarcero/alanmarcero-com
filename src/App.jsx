import { useState, useEffect } from 'react';
import './App.css';
import Hero from './components/Hero';
import PatchBankItem from './components/PatchBankItem';
import MusicItem from './components/MusicItem';
import { patchBanks as patchBanksData } from './data/patchBanks';
import { LAMBDA_URL } from './config';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [musicItems, setMusicItems] = useState([]);
  const [musicLoading, setMusicLoading] = useState(true);
  const [musicError, setMusicError] = useState(null);

  useEffect(() => {
    fetch(LAMBDA_URL)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load music');
        return response.json();
      })
      .then(data => {
        setMusicItems(data.items);
        setMusicLoading(false);
      })
      .catch(error => {
        setMusicError(error.message);
        setMusicLoading(false);
      });
  }, []);

  const query = searchQuery.toLowerCase();

  const filterPatchBank = (bank) => {
    if (!searchQuery) return true;
    const searchableText = `${bank.name} ${bank.description}`.toLowerCase();
    return searchableText.includes(query);
  };

  const filterMusicItem = (item) => {
    if (!searchQuery) return true;
    const searchableText = `${item.title} ${item.description || ''}`.toLowerCase();
    return searchableText.includes(query);
  };

  const filteredPatchBanks = patchBanksData.filter(filterPatchBank);
  const filteredMusicItems = musicItems.filter(filterMusicItem);

  return (
    <>
      <Hero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Patch Banks Section */}
      <section id="store">
        <h2 className="section-title">Patch Banks</h2>
        <div className="patch-banks-grid">
          {filteredPatchBanks.map((bank) => (
            <PatchBankItem key={bank.downloadLink} bank={bank} />
          ))}
        </div>
      </section>

      {/* Music and Remixes Section */}
      <section id="music-remixes">
        <h2 className="section-title">Music and Remixes</h2>
        <div id="music-container" className="store-container">
          {musicLoading && <p className="loading-message">Loading music...</p>}
          {musicError && <p className="error-message">Unable to load music. Please try again later.</p>}
          {!musicLoading && !musicError && filteredMusicItems.map((item) => (
            <MusicItem key={item.videoId} item={item} />
          ))}
        </div>
      </section>

      {/* Donate Section */}
      <section id="donate">
        <h2 className="section-title">Support My Work</h2>
        <p>If you enjoy the patches and music, consider supporting me via the following:</p>
        <a
          href="https://www.paypal.com/donate/?hosted_button_id=NFXJTJVKD43CG"
          className="btn-primary paypal-button"
          target="_blank"
          rel="noopener"
        >
          Donate via PayPal
        </a>
      </section>

      <footer>
        <p>2025 Alan Marcero</p>
      </footer>
    </>
  );
}

export default App;
