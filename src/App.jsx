import { useEffect } from 'react';
import PatchesPage from './patches/PatchesPage';
import { legacyRedirectFromLocation } from './site/legacyRoutes';

function App() {
  useEffect(() => {
    const target = legacyRedirectFromLocation(window.location);
    if (target) window.location.replace(target);
  }, []);

  return <PatchesPage />;
}

export default App;
