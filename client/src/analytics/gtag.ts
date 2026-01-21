export function trackPageView(path: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const gtagFn = (window as any).gtag;
  if (typeof gtagFn !== "function") {
    return;
  }

  gtagFn("event", "page_view", {
    page_path: path,
  });
}
