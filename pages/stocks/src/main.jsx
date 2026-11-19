import React from 'react';
import ReactDOM from 'react-dom/client';
import StocksApp from './StocksApp';
import ErrorBoundary from '../../../src/components/ErrorBoundary';
import SiteChrome from '../../../src/site/SiteChrome';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SiteChrome page="stocks">
        <StocksApp />
      </SiteChrome>
    </ErrorBoundary>
  </React.StrictMode>
);
