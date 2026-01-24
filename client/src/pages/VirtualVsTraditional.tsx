import { Link } from "wouter";

export default function VirtualVsTraditional() {
  const comparisonData = [
    { factor: "Cost", traditional: "$1,500 - $5,000+", virtual: "$200 - $800" },
    { factor: "Time to Implement", traditional: "3-7 days", virtual: "24-48 hours" },
    { factor: "Physical Requirements", traditional: "Property must be vacant or partially empty", virtual: "Empty rooms with clean photos" },
    { factor: "Impact on Online Listings", traditional: "Very effective", virtual: "Very effective when done well" },
    { factor: "Impact on In-Person Viewings", traditional: "Excellent", virtual: "Limited (empty spaces in person)" },
    { factor: "Design Flexibility", traditional: "Limited to available inventory", virtual: "Unlimited options" },
    { factor: "Ongoing Costs", traditional: "Monthly rental fees after initial period", virtual: "None" }
  ];

  const traditionalProsCons = {
    pros: [
      "Tangible experience for in-person viewings",
      "Creates authentic ambiance with lighting and textures",
      "Professional stagers assess and optimize the space in person"
    ],
    cons: [
      "Significantly higher cost",
      "Logistical challenges (delivery, installation, removal)",
      "Property must be vacant or partially vacant"
    ],
    bestFor: "Luxury properties, vacant homes in competitive markets, properties with architectural features that need highlighting"
  };

  const virtualProsCons = {
    pros: [
      "Significantly lower cost",
      "Fast turnaround (typically 24-48 hours)",
      "No logistical hassles or property disruption",
      "Can be done while occupants still live in the home"
    ],
    cons: [
      "In-person viewings reveal an empty space",
      "Quality varies widely between providers",
      "Poor quality virtual staging can look fake and harm credibility"
    ],
    bestFor: "Budget-conscious sellers, vacant properties, homes in less competitive markets, sellers who want to test different design styles"
  };

  const traditionalRecommendations = [
    "You're selling a luxury property where buyers expect a premium experience",
    "Your market is highly competitive with many similar properties",
    "You have unusual spaces that benefit from showing how furniture can be arranged",
    "Your budget allows for the higher investment"
  ];

  const virtualRecommendations = [
    "You're working with a limited staging budget",
    "You need staging implemented quickly",
    "The property is still occupied but photographs better empty",
    "You want to show multiple style options for the same space"
  ];

  return (
    <>
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Virtual vs. Traditional Staging</h1>
          <p className="text-xl text-gray-700 max-w-4xl">
            Compare the benefits, costs, and results of virtual and traditional staging methods to decide which is right for your property.
          </p>
          <p className="text-lg text-gray-600 max-w-4xl mt-4">
            If virtual staging looks like the right fit, view{" "}
            <Link href="/gallery" className="text-blue-600 underline">
              before-and-after examples
            </Link>{" "}
            in our proof library, then compare{" "}
            <Link href="/sales" className="text-blue-600 underline">
              plans and pricing
            </Link>{" "}
            to stage your own listings.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="text-xl font-bold">Traditional Staging</h2>
            </div>
            <div className="p-6">
              <img 
                src="/images/traditional-staging.webp" 
                alt="Traditional home staging" 
                className="w-full h-48 object-cover rounded-lg mb-4" 
                width="400" 
                height="192"
              />
              
              <h3 className="font-semibold text-lg mb-2">What It Is</h3>
              <p className="text-gray-700 mb-4">
                Physical furniture and décor items are brought into the property to showcase its potential and create an inviting atmosphere.
              </p>
              
              <h3 className="font-semibold text-lg mb-2">Average Cost</h3>
              <p className="text-gray-700 mb-4">
                $1,500 - $5,000+ depending on property size and rental duration (typically 1-3 months)
              </p>
              
              <h3 className="font-semibold text-lg mb-2">Pros</h3>
              <ul className="text-gray-700 mb-4 space-y-2">
                {traditionalProsCons.pros.map((pro, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {pro}
                  </li>
                ))}
              </ul>
              
              <h3 className="font-semibold text-lg mb-2">Cons</h3>
              <ul className="text-gray-700 mb-4 space-y-2">
                {traditionalProsCons.cons.map((con, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {con}
                  </li>
                ))}
              </ul>
              
              <h3 className="font-semibold text-lg mb-2">Best For</h3>
              <p className="text-gray-700">
                {traditionalProsCons.bestFor}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-purple-600 text-white p-4">
              <h2 className="text-xl font-bold">Virtual Staging</h2>
            </div>
            <div className="p-6">
              <img 
                src="/images/virtual-staging.webp" 
                alt="Virtual home staging" 
                className="w-full h-48 object-cover rounded-lg mb-4" 
                width="400" 
                height="192"
              />
              
              <h3 className="font-semibold text-lg mb-2">What It Is</h3>
              <p className="text-gray-700 mb-4">
                Digital furniture and décor are added to professional photos of empty rooms using specialized software and design expertise.
              </p>
              
              <h3 className="font-semibold text-lg mb-2">Average Cost</h3>
              <p className="text-gray-700 mb-4">
                $30 - $100 per room/photo, with most properties totaling $200 - $800
              </p>
              
              <h3 className="font-semibold text-lg mb-2">Pros</h3>
              <ul className="text-gray-700 mb-4 space-y-2">
                {virtualProsCons.pros.map((pro, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {pro}
                  </li>
                ))}
              </ul>
              
              <h3 className="font-semibold text-lg mb-2">Cons</h3>
              <ul className="text-gray-700 mb-4 space-y-2">
                {virtualProsCons.cons.map((con, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {con}
                  </li>
                ))}
              </ul>
              
              <h3 className="font-semibold text-lg mb-2">Best For</h3>
              <p className="text-gray-700">
                {virtualProsCons.bestFor}
              </p>
            </div>
          </div>
        </div>
        
        {/* Detailed Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Detailed Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factor</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traditional Staging</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Virtual Staging</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisonData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.factor}</td>
                    <td className="px-6 py-4">{item.traditional}</td>
                    <td className="px-6 py-4">{item.virtual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="bg-blue-50 rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-6">Our Recommendations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Choose Traditional Staging If:</h3>
              <ul className="space-y-2 text-gray-700">
                {traditionalRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-3">Choose Virtual Staging If:</h3>
              <ul className="space-y-2 text-gray-700">
                {virtualRecommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-white rounded-lg">
            <p className="italic text-gray-700">
              "The best approach often depends on your specific property, budget, and market conditions. Many sellers find success with a hybrid approach—using virtual staging for online listings and minimal traditional staging (like key furniture pieces) for in-person viewings."
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
