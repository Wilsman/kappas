import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://5bf241dff082ead8c4ca29b79789154c@o4509849192824832.ingest.de.sentry.io/4511282185044048",
  environment: import.meta.env.MODE,

  sendDefaultPii: true,

  integrations: [
    Sentry.browserTracingIntegration(),
  ],

  // Tracing
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost"],

  // Logs
  enableLogs: true,
});
