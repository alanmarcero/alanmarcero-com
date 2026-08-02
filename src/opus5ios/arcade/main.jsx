import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ArcadeSheet from './ArcadeSheet';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ArcadeSheet />
  </StrictMode>,
);
