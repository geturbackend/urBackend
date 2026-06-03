/**
 * Basic Telemetry / Analytics wrapper.
 * Currently uses console.log as a stub, but can be easily wired up
 * to PostHog, Mixpanel, Segment, etc.
 */

const isProd = import.meta.env.PROD;

export const trackEvent = (eventName, properties = {}) => {
  if (!isProd) {
    console.log(`[Telemetry] ${eventName}`, properties);
  }
  
  // Wire up actual analytics provider here:
  // if (window.posthog) {
  //   window.posthog.capture(eventName, properties);
  // }
};

// Common tracked events from Onboarding Audit:
export const trackSignupStarted = (source = 'web') => trackEvent('signup_started', { source });
export const trackSignupCompleted = (method = 'email') => trackEvent('signup_completed', { method });
export const trackOtpSent = () => trackEvent('otp_sent');
export const trackOtpVerified = () => trackEvent('otp_verified');
export const trackOtpFailed = (errorReason) => trackEvent('otp_failed', { errorReason });

export const trackProjectCreated = (projectId, hasAuthProvisioned) => 
  trackEvent('project_created', { projectId, hasAuthProvisioned });

export const trackKeysCopied = (keyType) => trackEvent('keys_copied', { keyType });
export const trackCollectionCreated = (collectionName) => trackEvent('collection_created', { collectionName });
