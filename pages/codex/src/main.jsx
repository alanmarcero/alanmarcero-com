import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CodexApp from './CodexApp';
import SiteChrome from '../../../src/site/SiteChrome';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteChrome page="codex" skipHref="#codex-main">
      <CodexApp />
    </SiteChrome>
  </StrictMode>,
);
