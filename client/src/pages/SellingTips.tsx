import { Link } from "wouter";

export default function SellingTips() {
  const quickFacts = [
    "Homes that sell within the first 2 weeks typically achieve higher prices",
    "95% of buyers use the internet to search for homes",
    "Homes with professional photos sell 32% faster"
  ];

  const relatedResources = [
    { title: "Home Staging Tips", path: "/home-staging-tips" },
    { title: "Professional Photography Guide", path: "/real-estate-photos" },
    { title: "Staging Options Comparison", path: "/virtual-vs-traditional" }
  ];

  const beforeListingTips = [
    {
      title: "1. Price It Right From the Start",
      content: "The most critical factor in selling quickly is correct pricing. Overpriced homes sit on the market longer and often end up selling for less than their true market value. Work with a realtor to conduct a comparative market analysis and set a competitive price."
    },
    {
      title: "2. Invest in Professional Photography",
      content: "High-quality photos are essential in today's digital-first real estate market. Professional photographers know how to highlight your home's best features and create images that stand out in listings."
    },
    {
      title: "3. Stage Your Home",
      content: "Whether you choose traditional or virtual staging, showcasing your home's potential is crucial. Staged homes sell 73% faster on average than non-staged properties."
    },
    {
      title: "4. Make Essential Repairs",
      content: "Fix the obvious issues before listing: leaky faucets, broken tiles, holes in walls, and any safety concerns. Small repairs prevent buyers from developing a negative impression or using defects to negotiate lower prices."
    },
    {
      title: "5. Deep Clean Everything",
      content: "Invest in professional cleaning or dedicate time to thoroughly clean every surface, including carpets, windows, and appliances. A spotless home suggests good maintenance throughout the property's life."
    }
  ];

  const marketingTips = [
    {
      title: "6. Create a Compelling Listing Description",
      content: "Focus on unique features and benefits of your property. Use descriptive language that helps buyers envision themselves living there. Highlight recent upgrades, energy-efficient features, and neighborhood amenities."
    },
    {
      title: "7. Leverage Social Media",
      content: "Ensure your listing is shared across social platforms. Consider creating a dedicated property page or video tour that can be easily shared. Ask friends and family to share the listing to expand your reach."
    },
    {
      title: "8. Consider 3D Tours and Video",
      content: "Properties with virtual tours receive 87% more views than those without. This technology allows buyers to explore the home in detail before deciding to view it in person, saving time for serious buyers."
    },
    {
      title: "9. Be Flexible with Showings",
      content: "Make your home as accessible as possible for showings, including evenings and weekends. The more potential buyers who can view your property, the faster you'll likely receive offers."
    },
    {
      title: "10. Host an Impactful Open House",
      content: "Create an event rather than just an open house. Consider offering refreshments, information about the neighborhood, and highlight sheets featuring the home's best attributes."
    }
  ];

  const closingTips = [
    {
      title: "11. Prepare All Documentation in Advance",
      content: "Have inspection reports, disclosure documents, HOA information, and home improvement records organized and ready. This preparation speeds up the process once you receive an offer."
    },
    {
      title: "12. Pre-Approve Potential Buyers",
      content: "Work with agents who pre-qualify their buyers. This ensures you're not wasting time with showings for unqualified prospects and reduces the chance of deals falling through due to financing issues."
    },
    {
      title: "13. Offer Buyer Incentives",
      content: "Consider offering incentives like covering closing costs, including certain furniture pieces, or providing a home warranty. These perks can be the deciding factor for buyers choosing between similar properties."
    },
    {
      title: "14. Be Prepared to Negotiate",
      content: "Know in advance what terms you're willing to be flexible on (closing date, included items, repairs) and where you need to stand firm (minimum acceptable price). Having this clarity speeds up negotiations."
    },
    {
      title: "15. Work with an Experienced Agent",
      content: "Partner with a real estate agent who has a proven track record of quick sales in your area. Their expertise, network, and negotiation skills can significantly reduce your property's time on market."
    }
  ];

  return (
    <>
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Selling Faster Tips</h1>
          <p className="text-xl text-gray-700 max-w-4xl">
            Proven strategies to reduce your property's time on market and maximize your selling price.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Main Content */}
            <article className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">15 Proven Tips to Sell Your Home Faster</h2>
              
              <img 
                src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                alt="Sold real estate sign" 
                className="w-full h-64 object-cover rounded-lg mb-6" 
                width="800" 
                height="256"
              />
              
              <div className="prose max-w-none text-gray-700">
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Quick Facts</h3>
                  <ul className="space-y-1">
                    {quickFacts.map((fact, index) => (
                      <li key={index} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <h3 className="text-xl font-semibold mt-6 mb-3" id="before-listing">Before Listing</h3>
                
                {beforeListingTips.map((tip, index) => (
                  <div key={index} className="mb-6">
                    <h4 className="font-semibold text-lg mb-2">{tip.title}</h4>
                    <p>{tip.content}</p>
                  </div>
                ))}
                
                <h3 className="text-xl font-semibold mt-6 mb-3" id="marketing-strategies">Marketing Strategies</h3>
                
                {marketingTips.map((tip, index) => (
                  <div key={index} className="mb-6">
                    <h4 className="font-semibold text-lg mb-2">{tip.title}</h4>
                    <p>{tip.content}</p>
                  </div>
                ))}
                
                <h3 className="text-xl font-semibold mt-6 mb-3" id="closing-the-deal">Closing the Deal</h3>
                
                {closingTips.map((tip, index) => (
                  <div key={index} className="mb-6">
                    <h4 className="font-semibold text-lg mb-2">{tip.title}</h4>
                    <p>{tip.content}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
          
          <div className="lg:col-span-1">
            {/* Sidebar */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-24">
              <h3 className="text-xl font-semibold mb-4">Quick Navigation</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#before-listing" className="text-primary hover:underline">Before Listing (Tips 1-5)</a>
                </li>
                <li>
                  <a href="#marketing-strategies" className="text-primary hover:underline">Marketing Strategies (Tips 6-10)</a>
                </li>
                <li>
                  <a href="#closing-the-deal" className="text-primary hover:underline">Closing the Deal (Tips 11-15)</a>
                </li>
              </ul>
              
              <hr className="my-6" />
              
              <h3 className="text-xl font-semibold mb-4">Related Resources</h3>
              <ul className="space-y-3">
                {relatedResources.map((resource, index) => (
                  <li key={index}>
                    <Link href={resource.path}>
                      <a className="text-primary hover:underline flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        {resource.title}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
