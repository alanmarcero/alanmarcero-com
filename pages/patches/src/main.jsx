import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from '../../../src/components/ErrorBoundary';
import PatchesPage from '../../../src/patches/PatchesPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PatchesPage />
    </ErrorBoundary>
  </React.StrictMode>
);
