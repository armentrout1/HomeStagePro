import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdUnit } from "@/components/ui/ad-unit";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
let stripePromise: Promise<any> | null = null;
const getStripe = () => {
  if (!stripePromise && import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

type FeatureKey =
  | "high_res_downloads"
  | "secure_token_auth"
  | "usage_tracking"
  | "priority_processing"
  | "access_all_styles"
  | "future_styles";

interface FeatureDefinition {
  key: FeatureKey;
  label: string;
}

interface PricingPlan {
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
  { key: "access_all_styles", label: "Access to all styles" },
  { key: "priority_processing", label: "Priority processing" },
  { key: "future_styles", label: "Upcoming style drops" },
];

const createFeatureSet = (overrides: Partial<Record<FeatureKey, boolean>> = {}) => ({
  high_res_downloads: false,
  secure_token_auth: false,
  usage_tracking: false,
  priority_processing: false,
  access_all_styles: false,
  future_styles: false,
  ...overrides,
});

const planIdMapping: Record<string, string> = {
  // TODO: remove mapping after backend plan ids updated
  "quick-pack": "day-pass",
  "value-pack": "pack-10",
  "pro-monthly": "unlimited",
};

export default function Upgrade() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const pricingPlans: PricingPlan[] = [
    {
      id: "quick-pack",
      name: "Quick Pack",
      price: 9,
      description: "5 stagings to use anytime",
      features: createFeatureSet({
        high_res_downloads: true,
        secure_token_auth: true,
        usage_tracking: false,
        priority_processing: false,
        access_all_styles: false,
        future_styles: false,
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
        priority_processing: false,
        access_all_styles: true,
        future_styles: false,
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
        priority_processing: true,
        access_all_styles: true,
        future_styles: true,
      }),
    },
  ];

  // Check for plan parameter in URL
  useEffect(() => {
    // Parse the query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const planId = searchParams.get('plan');
    
    if (planId) {
      // Find the plan with matching ID
      const selectedPlan = pricingPlans.find(
        (plan) => plan.id === planId
      );
      
      if (selectedPlan) {
        // Auto-select the plan from the URL parameter
        handleCheckout(selectedPlan);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckout = async (plan: PricingPlan) => {
    setIsLoading(plan.id);
    
    if (!getStripe()) {
      toast({
        title: "Error",
        description: "Payment system is not available. Please try again later.",
        variant: "destructive",
      });
      setIsLoading(null);
      return;
    }

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

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Failed to initiate checkout",
        variant: "destructive",
      });
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
            You've reached your free usage limit. Choose a plan below to continue staging rooms and transforming your real estate listings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-6 flex flex-col border-2 rounded-2xl transition-transform duration-200 ease-out ${
                plan.highlight
                  ? "border-primary shadow-xl md:hover:scale-[1.05] md:hover:shadow-2xl md:hover:z-10"
                  : "hover:border-primary hover:shadow-xl md:hover:scale-[1.03] md:hover:z-10"
              }`}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline mt-2">
                  <span className="text-4xl font-extrabold">${plan.price}</span>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </div>
              
              <ul className="space-y-3 mb-6 flex-grow">
                {featureDefinitions.map((feature) => {
                  const included = plan.features[feature.key];
                  return (
                    <li
                      key={feature.key}
                      className="flex items-center text-sm text-gray-900"
                    >
                      {included ? (
                        <svg
                          className="h-5 w-5 text-green-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 12h12"
                          />
                        </svg>
                      )}
                      {feature.label}
                    </li>
                  );
                })}
              </ul>
              
              <Button
                onClick={() => handleCheckout(plan)}
                className="w-full"
                disabled={isLoading === plan.id}
              >
                {isLoading === plan.id ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span>Get Started</span>
                )}
              </Button>
            </Card>
          ))}
        </div>

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
        
        {/* Ad Unit */}
        <div className="flex justify-center my-8">
          <AdUnit adSlot="5678901234" adFormat="horizontal" className="mx-auto" />
        </div>
      </div>
    </div>
  );
}