import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ArcadeShell from './ArcadeShell';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ArcadeShell />
  </StrictMode>,
);
