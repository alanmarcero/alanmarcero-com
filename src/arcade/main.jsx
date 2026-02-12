import React from 'react';
import ReactDOM from 'react-dom/client';
import ArcadeApp from './ArcadeApp';
import ErrorBoundary from '../components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ArcadeApp />
    </ErrorBoundary>
  </React.StrictMode>
);
