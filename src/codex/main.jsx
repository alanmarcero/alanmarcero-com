import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CodexApp from './CodexApp';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CodexApp />
  </StrictMode>,
);
