import React from 'react';
import ReactDOM from 'react-dom/client';
import TMobileApp from './TMobileApp';
import ErrorBoundary from '../../../src/components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TMobileApp />
    </ErrorBoundary>
  </React.StrictMode>
);
