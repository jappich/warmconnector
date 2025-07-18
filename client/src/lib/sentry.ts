import * as Sentry from '@sentry/browser';

export function initSentry() {
  // In a real implementation, this would be a real Sentry DSN
  // The DSN should be provided as an environment variable
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [],
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
      tracesSampleRate: 0.5,
      environment: import.meta.env.MODE,
      // Enable this if you want to capture performance data
      // performance monitoring
    });
  } else {
    console.warn('Sentry DSN not provided. Error tracking is disabled.');
  }
}

// Helper to capture exceptions
export function captureException(error: unknown, context?: Record<string, any>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { 
      extra: context 
    });
  } else {
    console.error('Error captured:', error);
    if (context) {
      console.error('Context:', context);
    }
  }
}