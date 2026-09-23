import React from 'react';
import ReactDOM from 'react-dom/client';
import StocksApp from './StocksApp';
import ErrorBoundary from '../../../src/components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StocksApp />
    </ErrorBoundary>
  </React.StrictMode>
);
