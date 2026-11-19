import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from '../../../src/components/ErrorBoundary';
import PluginsPage from '../../../src/plugins/PluginsPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PluginsPage />
    </ErrorBoundary>
  </React.StrictMode>
);
