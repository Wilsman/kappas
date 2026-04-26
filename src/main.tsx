import './instrument';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import { RootErrorFallback } from './components/RootErrorFallback.tsx';
import App from './App.tsx';
import './index.css';
import {
  installStaleAssetReloadHandler,
  isReactDomMutationError,
} from '@/utils/sentryNoiseFilters';

installStaleAssetReloadHandler();

const reportRecoverableError = Sentry.reactErrorHandler();

createRoot(document.getElementById('root')!, {
  onRecoverableError: (error, errorInfo) => {
    if (isReactDomMutationError(error)) {
      return;
    }

    reportRecoverableError(error, errorInfo);
  },
}).render(
  <StrictMode>
    <HelmetProvider>
      <Sentry.ErrorBoundary fallback={<RootErrorFallback />}>
        <App />
      </Sentry.ErrorBoundary>
    </HelmetProvider>
  </StrictMode>
);
