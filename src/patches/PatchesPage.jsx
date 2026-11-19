import { useCallback, useEffect, useRef, useState } from 'react';
import '../App.css';
import '../plugins/plugins.css';
import SiteChrome from '../site/SiteChrome';
import PatchBankItem from '../components/PatchBankItem';
import CompatibleInstruments from '../components/CompatibleInstruments';
import CatalogSearch from '../components/CatalogSearch';
import NoResults from '../components/NoResults';
import Toast from '../components/Toast';
import useCatalogSearch from '../hooks/useCatalogSearch';
import { patchBanks as patchBanksData } from '../data/patchBanks';
import { createSearchFilter } from '../utils/search';
import { TOAST_DISMISS_MS } from '../config';

const TOTAL_PATCHES = patchBanksData.reduce((sum, bank) => sum + (bank.count || 0), 0);
const PATCH_BANK_COUNT = patchBanksData.filter((bank) => bank.count).length;

const countLabel = (count) => `${count} ${count === 1 ? 'patch bank' : 'patch banks'}`;

export default function PatchesPage() {
  const [searchQuery, setSearchQuery] = useCatalogSearch();
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DISMISS_MS);
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const filtered = patchBanksData.filter(
    createSearchFilter(searchQuery, 'name', 'description', 'instruments', 'hardware', 'software', 'formats')
  );

  return (
    <SiteChrome page="patches">
      <main id="main-content">
        <section id="store" aria-labelledby="store-heading">
          <div className="section-head">
            <h1 id="store-heading" className="section-title" data-kicker="Sound design">Patch Banks</h1>
          </div>
          <p className="section-lead">Free synthesizer patch banks.</p>
          {!searchQuery && (
            <p className="section-stat">
              <span className="section-stat__value">{TOTAL_PATCHES.toLocaleString()}</span> patches across{' '}
              <span className="section-stat__value">{PATCH_BANK_COUNT}</span> instruments, free to download
            </p>
          )}
          <CatalogSearch
            value={searchQuery}
            onChange={setSearchQuery}
            label="Search patch banks"
            placeholder="Search patch banks..."
            results={searchQuery ? countLabel(filtered.length) : null}
          />
          {searchQuery && filtered.length === 0 && <NoResults query={searchQuery} />}
          <div className="module-grid">
            {filtered.map((bank, index) => (
              <PatchBankItem
                key={bank.downloadLink}
                bank={bank}
                style={{ '--card-index': index }}
                onDownload={() => showToast('Downloading now...')}
              />
            ))}
          </div>
          <CompatibleInstruments banks={filtered} />
        </section>
      </main>
      <Toast message={toast} visible={!!toast} />
    </SiteChrome>
  );
}
