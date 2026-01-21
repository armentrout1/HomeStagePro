export type BeginCheckoutPayload = {
  currency?: string;
  value?: number;
  items?: Array<{
    item_id?: string;
    item_name?: string;
    price?: number;
    quantity?: number;
  }>;
};

export function trackBeginCheckout(payload: BeginCheckoutPayload): void {
  if (typeof window === "undefined") return;
  const gtagFn = (window as any).gtag;
  if (typeof gtagFn !== "function") return;

  gtagFn("event", "begin_checkout", payload);
}
