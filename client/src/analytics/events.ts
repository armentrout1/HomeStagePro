export function trackEvent(name: string, values: Record<string, string | number> = {}) {
  if (typeof window !== "undefined" && window.location.hostname === "roomstagerpro.com") {
    window.gtag?.("event", name, values);
  }
}
