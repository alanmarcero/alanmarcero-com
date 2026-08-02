import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MatrixApp from './MatrixApp';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MatrixApp />
  </StrictMode>,
);
