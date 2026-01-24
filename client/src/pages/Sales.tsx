import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { PricingPlans, type PricingPlan } from "@/components/billing/PricingPlans";
import { Link } from "wouter";

// Sample before/after images
const beforeAfterSamples = [
  {
    id: "living-room",
    before: "/sample-images/living-before.jpg",
    after: "/sample-images/living-after.webp",
    title: "Living Room Transformation"
  },
  {
    id: "bedroom",
    before: "/sample-images/bed-before.webp",
    after: "/sample-images/bed-after.webp",
    title: "Bedroom Enhancement"
  }
];

// Testimonials
const testimonials = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Real Estate Agent",
    content: "These AI stagings made our listing feel finished and move-in ready. The photos were incredibly realistic and helped buyers visualize the space.",
    rating: 5
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    role: "Home Seller",
    content: "I was skeptical at first, but these virtual stagings transformed my empty condo. We had serious interest almost immediately after posting.",
    rating: 5
  },
  {
    id: "3",
    name: "Jennifer Williams",
    role: "Property Manager",
    content: "The AI staging has been a game-changer for our rental properties. We're seeing increased interest and applications since implementing these images.",
    rating: 4
  }
];

// Pricing plans
const pricingPlans: PricingPlan[] = [
  {
    id: "quick-pack",
    name: "Quick Pack",
    price: "$9",
    subtitle: "5 stagings to use anytime",
    features: [
      "5 AI stagings included",
      "High-resolution downloads",
      "Secure token authentication",
      "Use anytime, no expiration",
    ],
    ctaLabel: "Get Started",
  },
  {
    id: "value-pack",
    name: "Value Pack",
    price: "$25",
    subtitle: "20 stagings to use anytime",
    features: [
      "20 AI stagings included",
      "High-resolution downloads",
      "Secure token authentication",
      "Access to all room types",
    ],
    ctaLabel: "Get Started",
  },
  {
    id: "pro-monthly",
    name: "Pro Monthly",
    price: "$49",
    subtitle: "50 stagings every month",
    features: [
      "50 AI stagings per month",
      "High-resolution downloads",
      "Secure token authentication",
      "Access to all room types",
    ],
    ctaLabel: "Get Started",
  },
];

// Benefits of using AI staging
const stagingBenefits = [
  {
    title: "Help Listings Stand Out",
    description: "Properties with staged photos feel polished and more compelling than empty rooms.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Support Confident Pricing",
    description: "Professionally presented spaces reinforce the value of your asking price.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Spend Less Than Traditional Staging",
    description: "Virtual staging provides a polished look without costly furniture rentals.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: "Boost Buyer Interest",
    description: "Thoughtfully staged listings capture more attention from active shoppers.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  }
];

export default function Sales() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(pricingPlans[1]?.id ?? pricingPlans[0]?.id ?? null);

  const handlePlanCtaClick = (planId: string) => {
    window.location.href = `/upgrade?plan=${planId}`;
  };

  return (
    <>
      <section className="py-12 bg-gradient-to-br from-white to-blue-50">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Affordable Virtual Staging That Helps Homes Sell Faster
            </h1>
            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Professional staging helps listings look more market-ready and attract buyers faster.
              RoomStagerPro offers affordable virtual staging powered by AI, delivering polished,
              realistic results at a fraction of the cost of traditional staging.
            </p>

            <p className="text-base text-gray-700 mb-8">Try 2 free stagings — no login required.</p>
            <Link href="/#ai-stager">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Staging Now
              </Button>
            </Link>
          </div>

          {/* Pricing Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-4">Choose Your Staging Plan</h2>
            <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
              Select the perfect plan for your needs. All plans include high-quality AI-generated stagings you can download and use immediately.
            </p>
            <PricingPlans
              plans={pricingPlans}
              selectedPlanId={selectedPlanId}
              onSelectPlan={setSelectedPlanId}
              onCtaClick={handlePlanCtaClick}
            />
          </div>

          {/* Benefits Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">Why Virtual Staging Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stagingBenefits.map((benefit, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">{benefit.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Before/After Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">See the Transformation</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {beforeAfterSamples.map((sample) => (
                <div key={sample.id} className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-bold mb-4 text-center">{sample.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-center mb-2 text-gray-500 font-medium">Before</p>
                      <img 
                        src={sample.before} 
                        alt={`Before ${sample.title}`}
                        className="w-full h-64 object-cover rounded-md"
                      />
                    </div>
                    <div>
                      <p className="text-center mb-2 text-gray-500 font-medium">After</p>
                      <img 
                        src={sample.after} 
                        alt={`After ${sample.title}`}
                        className="w-full h-64 object-cover rounded-md"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-4">Choose Your Staging Plan</h2>
            <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
              Select the perfect plan for your needs. All plans include high-quality AI-generated stagings you can download and use immediately.
            </p>
            <PricingPlans
              plans={pricingPlans}
              selectedPlanId={selectedPlanId}
              onSelectPlan={setSelectedPlanId}
              onCtaClick={handlePlanCtaClick}
            />
          </div>

          {/* Testimonials */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{testimonial.name}</h3>
                      <p className="text-gray-500 text-sm">{testimonial.role}</p>
                    </div>
                    <StarRating rating={testimonial.rating} />
                  </div>
                  <p className="text-gray-600 italic">"{testimonial.content}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-6 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Property Listings?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join real estate professionals using AI staging to present listings with a polished, market-ready look.
            </p>
            <Link href="/upgrade">
              <Button size="lg" variant="secondary" className="text-primary font-bold text-lg px-8 py-6">
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}