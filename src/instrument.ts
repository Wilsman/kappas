import * as Sentry from "@sentry/react";
import {
  isReactDomMutationError,
  isStaleAssetError,
} from "@/utils/sentryNoiseFilters";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const sentryEnvironment =
  import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE;

const tracesSampleRate =
  sentryEnvironment === "development"
    ? 1.0
    : sentryEnvironment === "preview"
      ? 0.2
      : 0.1;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,

    sendDefaultPii: false,

    integrations: [Sentry.browserTracingIntegration()],

    // Tracing
    tracesSampleRate,
    // api.tarkov.dev does not allow Sentry tracing headers in CORS preflight.
    tracePropagationTargets: ["localhost"],

    // Logs
    enableLogs: true,

    beforeSend(event, hint) {
      const originalException = hint.originalException;

      if (
        isReactDomMutationError(originalException) ||
        isStaleAssetError(originalException)
      ) {
        return null;
      }

      return event;
    },
  });
}
