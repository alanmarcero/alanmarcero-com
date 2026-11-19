import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from '../../../src/components/ErrorBoundary';
import ContactPage from '../../../src/contact/ContactPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ContactPage />
    </ErrorBoundary>
  </React.StrictMode>
);
