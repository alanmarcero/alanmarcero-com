import React from 'react';
import { createRoot } from 'react-dom/client';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import './site.css';

const page = document.documentElement.dataset.page || '';

const header = document.getElementById('site-header');
if (header) {
  createRoot(header).render(
    <React.StrictMode>
      <>
        <a className="skip-to-content" href="#main-content">Skip to main content</a>
        <SiteHeader page={page} />
      </>
    </React.StrictMode>
  );
}

const footer = document.getElementById('site-footer');
if (footer) {
  createRoot(footer).render(
    <React.StrictMode>
      <SiteFooter />
    </React.StrictMode>
  );
}
