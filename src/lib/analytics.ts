// Privacy-respecting usage analytics. Off unless VITE_ANALYTICS_ENDPOINT is set at build time.
// Sends one JSON POST per event to a Plausible-compatible endpoint ({ name, url, domain, props }).
// No cookies, no localStorage, no user or project identifiers. Never pass PII in props
// (no emails, addresses, project names, or financial values).
// ponytail: provider is pluggable via the endpoint only; no SDK, no script tag. Swap the send() body if the provider changes.

export type AnalyticsProps = Record<string, string | number | boolean>;

const endpoint = (): string | undefined => import.meta.env.VITE_ANALYTICS_ENDPOINT || undefined;

export const analyticsEnabled = (): boolean => Boolean(endpoint());

// Drop query strings and hashes, and replace project ids so URLs carry no record identifiers.
export const normalizePath = (path: string): string =>
  path.replace(/[?#].*$/, "").replace(/^\/project\/[^/]+/, "/project/:id");

const send = (name: string, url: string, props?: AnalyticsProps): void => {
  const target = endpoint();
  if (!target || typeof window === "undefined" || typeof fetch !== "function") return;
  try {
    fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        url,
        domain: import.meta.env.VITE_ANALYTICS_DOMAIN || window.location.hostname,
        ...(props ? { props } : {}),
      }),
      keepalive: true,
      credentials: "omit",
    }).catch(() => {});
  } catch {
    // Analytics must never break the app.
  }
};

export const trackPageView = (path: string): void => {
  if (!analyticsEnabled() || typeof window === "undefined") return;
  send("pageview", `${window.location.origin}${normalizePath(path)}`);
};

export const trackEvent = (name: string, props?: AnalyticsProps): void => {
  if (!analyticsEnabled() || typeof window === "undefined") return;
  send(name, window.location.origin + "/", props);
};
