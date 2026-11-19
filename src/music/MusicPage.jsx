import '../App.css';
import '../plugins/plugins.css';
import SiteChrome from '../site/SiteChrome';
import MusicItem from '../components/MusicItem';
import SkeletonCard from '../components/SkeletonCard';
import CatalogSearch from '../components/CatalogSearch';
import NoResults from '../components/NoResults';
import useMusicItems from '../hooks/useMusicItems';
import useCatalogSearch from '../hooks/useCatalogSearch';
import { createSearchFilter } from '../utils/search';

const SKELETON_COUNT = 3;

const countLabel = (count) => `${count} ${count === 1 ? 'release' : 'releases'}`;

export default function MusicPage() {
  const [searchQuery, setSearchQuery] = useCatalogSearch();
  const { musicItems, musicLoading, musicError } = useMusicItems();
  const filtered = musicItems.filter(createSearchFilter(searchQuery, 'title', 'description'));
  const showEmpty = searchQuery && filtered.length === 0 && !musicLoading;

  return (
    <SiteChrome page="music">
      <main id="main-content">
        <section id="music-remixes" aria-labelledby="music-heading">
          <div className="section-head">
            <h1 id="music-heading" className="section-title" data-kicker="Releases">Music and Remixes</h1>
          </div>
          <p className="section-lead">Original tracks and remixes.</p>
          {!searchQuery && !musicLoading && !musicError && filtered.length > 0 && (
            <p className="section-stat">
              <span className="section-stat__value">{filtered.length}</span> releases and remixes, streaming on YouTube, Spotify, and Pandora
            </p>
          )}
          <CatalogSearch
            value={searchQuery}
            onChange={setSearchQuery}
            label="Search music"
            placeholder="Search music..."
            results={searchQuery && !musicLoading ? countLabel(filtered.length) : null}
          />
          {showEmpty && <NoResults query={searchQuery} />}
          <div className="module-grid">
            {musicLoading && Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
            {musicError && <p className="error-message">Unable to load music. Please try again later.</p>}
            {!musicLoading && !musicError && filtered.map((item, index) => (
              <MusicItem key={item.videoId} item={item} style={{ '--card-index': index }} />
            ))}
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
