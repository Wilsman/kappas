import './instrument';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <HelmetProvider>
      <Sentry.ErrorBoundary fallback={<p>Something went wrong</p>}>
        <App />
      </Sentry.ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);
