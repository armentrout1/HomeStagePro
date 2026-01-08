import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMemo, type KeyboardEventHandler } from "react";

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  subtitle?: string;
  features: string[];
  ctaLabel: string;
};

export function PricingPlans(props: {
  plans: PricingPlan[];
  selectedPlanId?: string | null;
  onSelectPlan: (planId: string) => void;
  onCtaClick: (planId: string) => void;
}) {
  const { plans, selectedPlanId, onSelectPlan, onCtaClick } = props;

  const renderedPlans = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        isSelected: plan.id === selectedPlanId,
      })),
    [plans, selectedPlanId],
  );

  if (!renderedPlans.length) {
    return null;
  }

  return (
    <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
      {renderedPlans.map((plan) => {
        const handleCardSelect = () => onSelectPlan(plan.id);
        const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelectPlan(plan.id);
          }
        };
        const normalizedLabel = plan.ctaLabel.toLowerCase();
        const isProcessing = normalizedLabel.includes("processing");

        return (
          <Card
            key={plan.id}
            role="button"
            tabIndex={0}
            aria-pressed={plan.isSelected}
            onClick={handleCardSelect}
            onKeyDown={handleKeyDown}
            className={`relative flex flex-col rounded-2xl border-2 p-6 transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              plan.isSelected
                ? "border-primary shadow-xl md:scale-[1.03]"
                : "hover:border-primary hover:shadow-xl md:hover:scale-[1.03]"
            }`}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline">
                <span className="text-4xl font-extrabold">{plan.price}</span>
              </div>
              {plan.subtitle ? (
                <p className="mt-2 text-gray-600">{plan.subtitle}</p>
              ) : null}
            </div>

            <ul className="mb-6 flex-grow space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center text-sm text-gray-900">
                  <svg
                    className="mr-2 h-5 w-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              type="button"
              className="w-full"
              disabled={isProcessing}
              onClick={(event) => {
                event.stopPropagation();
                onSelectPlan(plan.id);
                onCtaClick(plan.id);
              }}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {plan.ctaLabel}
                </span>
              ) : (
                plan.ctaLabel
              )}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
