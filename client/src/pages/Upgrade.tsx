import { useMemo, useEffect, useState } from "react";

import {
  PricingPlans,
  type PricingPlan as SharedPricingPlan,
} from "@/components/billing/PricingPlans";
import { trackBeginCheckout } from "@/analytics/ecommerce";

import { useToast } from "@/hooks/use-toast";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
let stripePromise: Promise<Stripe | null> | null = null;
let runtimeStripePublicKey: string | null | undefined = undefined;

const getStripePublicKey = async (): Promise<string | null> => {
  if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  }

  if (runtimeStripePublicKey !== undefined) {
    return runtimeStripePublicKey;
  }

  try {
    const response = await fetch("/api/public-config");
    if (!response.ok) {
      runtimeStripePublicKey = null;
      return runtimeStripePublicKey;
    }

    const { stripePublicKey } = await response.json();
    runtimeStripePublicKey = stripePublicKey ?? null;
  } catch {
    runtimeStripePublicKey = null;
  }

  return runtimeStripePublicKey ?? null;
};

const getStripeAsync = async (): Promise<Stripe | null> => {
  const key = await getStripePublicKey();
  if (!key) {
    return null;
  }

  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }

  return stripePromise;
};

type FeatureKey =
  | "high_res_downloads"
  | "secure_token_auth"
  | "usage_tracking"
  | "access_all_styles";

interface FeatureDefinition {
  key: FeatureKey;
  label: string;
}

interface UpgradePricingPlan {
  id: string;
  name: string;
  price: number;
  description: string;

  highlight?: boolean;
  features: Record<FeatureKey, boolean>;
}

const featureDefinitions: FeatureDefinition[] = [
  { key: "high_res_downloads", label: "High-resolution downloads" },
  { key: "secure_token_auth", label: "Secure token authentication" },
  { key: "usage_tracking", label: "Usage tracking" },
  { key: "access_all_styles", label: "Access to all room types" },
];

const createFeatureSet = (overrides: Partial<Record<FeatureKey, boolean>> = {}) => ({
  high_res_downloads: false,
  secure_token_auth: false,
  usage_tracking: false,
  access_all_styles: false,
  ...overrides,
});

const planIdMapping: Record<string, string> = {
  "quick-pack": "quick-pack",
  "value-pack": "value-pack",
  "pro-monthly": "pro-monthly",
};

export default function Upgrade() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const pricingPlans = useMemo<UpgradePricingPlan[]>(
    () => [
      {
        id: "quick-pack",
        name: "Quick Pack",
        price: 9,
        description: "5 stagings to use anytime",
        features: createFeatureSet({
          high_res_downloads: true,
          secure_token_auth: true,
          usage_tracking: false,
          access_all_styles: false,
        }),
      },
      {
        id: "value-pack",
        name: "Value Pack",
        price: 25,
        description: "20 stagings to use anytime",
        highlight: true,
        features: createFeatureSet({
          high_res_downloads: true,
          secure_token_auth: true,
          usage_tracking: true,
          access_all_styles: true,
        }),
      },
      {
        id: "pro-monthly",
        name: "Pro Monthly",
        price: 49,
        description: "50 stagings per month",
        features: createFeatureSet({
          high_res_downloads: true,
          secure_token_auth: true,
          usage_tracking: true,
          access_all_styles: true,
        }),
      },
    ],
    [],
  );

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    const highlightedPlan = pricingPlans.find((plan) => plan.highlight);
    return highlightedPlan?.id ?? pricingPlans[0]?.id ?? null;
  });

  const pricingPlanCards: SharedPricingPlan[] = pricingPlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: `$${plan.price}`,
    subtitle: plan.description,
    features: featureDefinitions
      .filter((feature) => plan.features[feature.key])
      .map((feature) => feature.label),
    ctaLabel: isLoading === plan.id ? "Processing..." : "Get Started",
  }));

  // Check for plan parameter in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const planId = searchParams.get("plan");

    if (planId) {
      const selectedPlan = pricingPlans.find((plan) => plan.id === planId);
      if (selectedPlan) {
        setSelectedPlanId(selectedPlan.id);
        handleCheckout(selectedPlan.id);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckout = async (planId: string) => {
    const plan = pricingPlans.find((pricingPlan) => pricingPlan.id === planId);
    if (!plan) {
      return;
    }

    trackBeginCheckout({
      currency: "USD",
      value: plan.price,
      items: [
        {
          item_id: planId,
          item_name: plan.name,
          price: plan.price,
          quantity: 1,
        },
      ],
    });

    setIsLoading(plan.id);

    try {
      // Create checkout session on the server
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        planId: planIdMapping[plan.id],
        planName: plan.name,
        amount: plan.price,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const session = await response.json();

      if (session?.url) {
        window.location.href = session.url;
        return;
      }

      const stripe = await getStripeAsync();
      if (!stripe) {
        toast.error(
          "Error",
          "Payment system is not available. Please try again later.",
        );

        setIsLoading(null);
        return;
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error(
        "Checkout Failed",
        error instanceof Error ? error.message : "Failed to initiate checkout",
      );
    }

    setIsLoading(null);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-pink-600 text-transparent bg-clip-text">
            Upgrade Your Staging Experience
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Purchase a credit pack below to keep staging rooms and transforming your real estate listings.
          </p>
        </div>

        <PricingPlans
          plans={pricingPlanCards}
          selectedPlanId={selectedPlanId}
          onSelectPlan={setSelectedPlanId}
          onCtaClick={handleCheckout}
        />

        <div className="bg-gray-50 p-6 rounded-lg mb-12">
          <div className="flex items-start">
            <div className="mr-4 text-blue-600">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Secure & Simple</h4>
              <p className="text-gray-600">
                All payments are processed securely through Stripe. After purchase, a secure JWT token is automatically stored in your browser as an HTTP-only cookie. This token grants you immediate access to your plan benefits without requiring registration or login. We don't store your payment details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}