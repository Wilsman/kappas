import * as Sentry from "@sentry/react";

const sentryEnvironment =
  import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE;

const tracesSampleRate =
  sentryEnvironment === "development"
    ? 1.0
    : sentryEnvironment === "preview"
      ? 0.2
      : 0.1;

Sentry.init({
  dsn: "https://5bf241dff082ead8c4ca29b79789154c@o4509849192824832.ingest.de.sentry.io/4511282185044048",
  environment: sentryEnvironment,

  sendDefaultPii: false,

  integrations: [Sentry.browserTracingIntegration()],

  // Tracing
  tracesSampleRate,
  tracePropagationTargets: ["localhost"],

  // Logs
  enableLogs: true,
});
