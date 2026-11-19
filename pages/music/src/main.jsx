import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from '../../../src/components/ErrorBoundary';
import MusicPage from '../../../src/music/MusicPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <MusicPage />
    </ErrorBoundary>
  </React.StrictMode>
);
