import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Machines from './Machines';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Machines />
  </StrictMode>,
);
