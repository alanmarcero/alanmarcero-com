import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AlmanacApp from './AlmanacApp';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlmanacApp />
  </StrictMode>,
);
