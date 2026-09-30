import { useState } from "react";
import {
  PricingPlans,
  type PricingPlan,
} from "@/components/billing/PricingPlans";
import { Link } from "wouter";

// Pricing plans
const pricingPlans: PricingPlan[] = [
  {
    id: "quick-pack",
    name: "Quick Pack",
    price: "$9",
    subtitle: "5 stagings, valid for 365 days",
    features: [
      "5 AI stagings included",
      "High-resolution downloads",
      "Reopen with your private email link",
      "Valid for 365 days",
    ],
    ctaLabel: "Get Started",
  },
  {
    id: "value-pack",
    name: "Value Pack",
    price: "$25",
    subtitle: "20 stagings, valid for 365 days",
    features: [
      "20 AI stagings included",
      "High-resolution downloads",
      "Reopen with your private email link",
      "Access to all room types",
    ],
    ctaLabel: "Get Started",
  },
  {
    id: "pro-monthly",
    name: "Pro Pack",
    price: "$49",
    subtitle: "50 stagings, valid for 30 days",
    features: [
      "50 AI stagings, valid for 30 days",
      "High-resolution downloads",
      "Reopen with your private email link",
      "Access to all room types",
    ],
    ctaLabel: "Get Started",
  },
];

export default function Sales() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    pricingPlans[1]?.id ?? pricingPlans[0]?.id ?? null,
  );

  const handlePlanCtaClick = (planId: string) => {
    window.location.href = `/upgrade?plan=${planId}`;
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="mx-auto mb-10 max-w-2xl text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Virtual staging, priced per image
        </h1>
        <p className="text-lg text-slate-600">
          Start with five photos for $9. Every pack is a one-time purchase with
          no automatic renewal.
        </p>
        <p>
          <Link href="/gallery" className="underline">
            See actual before-and-after examples
          </Link>{" "}
          ·{" "}
          <Link href="/access" className="underline">
            Already purchased? Reopen your pack
          </Link>
        </p>
      </div>
      <PricingPlans
        plans={pricingPlans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={setSelectedPlanId}
        onCtaClick={handlePlanCtaClick}
      />
      <section className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-2xl font-semibold">What you get</h2>
        <p>
          Furnish empty rooms, replace existing furniture, or remove clutter.
          Select where edits can happen; the original pixels outside your
          selection are preserved.
        </p>
        <p>
          One completed image uses one credit. Failed generations restore the
          credit. Reopen your pack and saved images using your private email
          link on another device.
        </p>
        <p>
          Review each image for accuracy and disclose virtual staging when
          publishing. AI can make mistakes inside the selected area.
        </p>
        <p>
          Quick and Value packs are valid for 365 days. Pro Pack is valid for 30
          days.
        </p>
      </section>
    </section>
  );
}
