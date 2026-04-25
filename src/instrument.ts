import * as Sentry from "@sentry/react";

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
    tracePropagationTargets: ["localhost", "api.tarkov.dev"],

    // Logs
    enableLogs: true,
  });
}
