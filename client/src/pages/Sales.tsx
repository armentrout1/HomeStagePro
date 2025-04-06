import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Link } from "wouter";

// Pricing plan type
interface PricingPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlight?: boolean;
}

// Sample before/after images
const beforeAfterSamples = [
  {
    id: "living-room",
    before: "https://images.openai.com/blob/9b747797-3a49-42fe-8d61-cc0878f92de7/empty-living-room.png",
    after: "https://images.openai.com/blob/fd84cd3f-7da7-4e51-a8f4-55aff12d65e0/staged-living-room.png",
    title: "Living Room Transformation"
  },
  {
    id: "bedroom",
    before: "https://images.openai.com/blob/1d5b2a2d-f41b-465c-bd52-7d15dc373aa0/empty-bedroom.png",
    after: "https://images.openai.com/blob/eaa8d193-39bd-4fe7-a18e-76e3c55f4a43/staged-bedroom.png",
    title: "Bedroom Enhancement"
  }
];

// Testimonials
const testimonials = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Real Estate Agent",
    content: "We sold our client's property 40% faster after using these AI stagings. The photos were incredibly realistic and helped buyers visualize the space.",
    rating: 5
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    role: "Home Seller",
    content: "I was skeptical at first, but these virtual stagings transformed my empty condo. We had three offers within a week!",
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
    id: "day-pass",
    name: "Day Pass",
    price: 3,
    description: "Perfect for a single property",
    features: [
      "5 room stagings",
      "24-hour access",
      "High-resolution images",
      "Download all images"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    description: "Great for multiple properties",
    features: [
      "15 room stagings",
      "30-day access",
      "High-resolution images",
      "Download all images",
      "Priority processing"
    ],
    highlight: true
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 19,
    description: "For real estate professionals",
    features: [
      "Unlimited stagings",
      "30-day access",
      "High-resolution images",
      "Download all images",
      "Priority processing",
      "Custom furniture styles",
      "Commercial use license"
    ]
  }
];

// Benefits of using AI staging
const stagingBenefits = [
  {
    title: "Sell Properties 30% Faster",
    description: "Properties with staged photos sell significantly faster than those with empty rooms.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Increase Sale Price by 5-10%",
    description: "Professionally staged properties typically command higher selling prices.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    title: "Save Thousands on Traditional Staging",
    description: "Virtual staging costs a fraction of physical staging while delivering similar benefits.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: "Generate More Buyer Interest",
    description: "Staged listings receive 40% more buyer inquiries than non-staged properties.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  }
];

export default function Sales() {
  // Handle upgrade click 
  const handleUpgradeClick = (plan: PricingPlan) => {
    // Navigate to the upgrade page with the selected plan
    window.location.href = `/upgrade?plan=${plan.id}`;
  };

  return (
    <>
      <section className="py-12 bg-gradient-to-br from-white to-blue-50">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transform Empty Spaces into Selling Opportunities
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional staging helps sell properties <span className="font-semibold">faster and for more money</span>. 
              Our AI staging delivers professional results at a fraction of the cost.
            </p>
            <Link href="/upgrade">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Staging Now
              </Button>
            </Link>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    plan.highlight ? 'border-2 border-primary transform scale-105' : ''
                  }`}
                >
                  <div className={`p-6 ${plan.highlight ? 'bg-primary text-white' : 'bg-gray-50'}`}>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      {plan.id !== "unlimited" ? (
                        <span className="ml-1 text-sm opacity-80">/one-time</span>
                      ) : (
                        <span className="ml-1 text-sm opacity-80">/month</span>
                      )}
                    </div>
                    <p className={`mt-2 ${plan.highlight ? 'text-white opacity-90' : 'text-gray-500'}`}>
                      {plan.description}
                    </p>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5 text-green-500 mr-2" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleUpgradeClick(plan)}
                      className={`mt-6 w-full py-3 px-4 rounded-md ${
                        plan.highlight 
                          ? 'bg-primary text-white hover:bg-primary/90' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } font-medium transition-colors`}
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
              Join thousands of real estate professionals using AI staging to sell properties faster and at better prices.
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