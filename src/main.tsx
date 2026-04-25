import './instrument';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import { RootErrorFallback } from './components/RootErrorFallback.tsx';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!, {
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <HelmetProvider>
      <Sentry.ErrorBoundary fallback={<RootErrorFallback />}>
        <App />
      </Sentry.ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);
