import { useState, useEffect } from 'react';
import './App.css';
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
      {/* News Banner */}
      <div className="news-banner" id="newsBanner">
        <div className="news-content">
          <span id="newsText">
            April 2025. The site is back up! Please consider supporting via PayPal.
          </span>
        </div>
      </div>

      {/* Header */}
      <header>
        <h1>Alan's Synthesizer Patch Banks</h1>
        <div className="search-container">
          <input
            type="text"
            id="searchInput"
            placeholder="Search patches and music..."
            aria-label="Search patches and music"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* About Me Section */}
      <section id="about">
        <h2 className="section-title">About Me</h2>
        <div className="about-me-content">
          <img src="/about-me.webp" alt="About Me Image" className="about-me-image" />
          <p>
            Hi, I'm Alan from Boston, USA. I've been making trance and other electronic music with synthesizers and my PC since my high school days in the early 2000s. This is where I share my passion for creating original tracks, remixes, and sound design.
          </p>
          <p>
            My music has been supported by trance legends like Ferry Corsten, Paul van Dyk, Sean Tyas, Daniel Kandi, and more. Remixes of my tracks have been featured on A State of Trance, BBC Radio 1's Essential Mix, and Trance Around the World. I've released music on iconic labels like Armada, Bonzai, and Ministry of Sound.
          </p>
          <p>
            Thanks for stopping by. <a className="youtube-link" href="https://www.youtube.com/alanmarcero" target="_blank" rel="noopener noreferrer">Subscribe to my YouTube!</a>
          </p>
        </div>
      </section>

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
          className="paypal-button"
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