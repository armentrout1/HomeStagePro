export function trackPageView(path: string): void {
  if (typeof window === "undefined" || window.location.hostname !== "roomstagerpro.com") {
    return;
  }

  if (["/access", "/thank-you"].includes(path.split(/[?#]/)[0])) return;
  const gtagFn = (window as any).gtag;
  if (typeof gtagFn !== "function") {
    return;
  }

  gtagFn("event", "page_view", {
    page_path: path.split(/[?#]/)[0],
    page_location: window.location.origin + path.split(/[?#]/)[0],
  });
}
