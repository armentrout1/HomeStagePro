import { Link } from "wouter";

export default function RealEstatePhotos() {
  const relatedResources = [
    { title: "Home Staging Tips", path: "/home-staging-tips" },
    { title: "Virtual vs Traditional Staging", path: "/virtual-vs-traditional" },
    { title: "Tips for Selling Faster", path: "/selling-tips" }
  ];

  const photographyTechniques = [
    {
      title: "HDR Photography",
      description: "Combines multiple exposures to show both bright and dark areas clearly, perfect for rooms with windows."
    },
    {
      title: "Twilight Shots",
      description: "Exterior photos taken at dusk with interior lights on create a warm, inviting impression."
    },
    {
      title: "Drone Photography",
      description: "Aerial views showcase the property's surroundings and are especially valuable for larger properties."
    },
    {
      title: "Virtual Tours",
      description: "360° photography creates immersive experiences that let buyers explore remotely."
    }
  ];

  return (
    <>
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Real Estate Photos Matter</h1>
          <p className="text-xl text-gray-700 max-w-4xl">
            Learn why professional photography is one of the most important investments when selling your property.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Main Content */}
            <article className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">The Impact of Professional Photography</h2>
              
              <img 
                src="https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                alt="Professional real estate photography" 
                className="w-full h-64 object-cover rounded-lg mb-6" 
                width="800" 
                height="256"
              />
              
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  In today's digital-first real estate market, professional photography isn't just a luxury—it's a necessity. Here's why investing in quality photos can dramatically impact your property's sale.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">First Impressions Happen Online</h3>
                <p className="mb-4">
                  Over 95% of home buyers begin their search online, and they typically decide whether to view a property in person based solely on the listing photos. Professional photos ensure your property makes a stellar first impression.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Higher Perceived Value</h3>
                <p className="mb-4">
                  Homes with high-quality photographs are perceived as more valuable. Professional photographers understand how to highlight a property's best features and minimize less desirable aspects.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Professional Equipment Makes a Difference</h3>
                <p className="mb-4">
                  Professional photographers use specialized equipment including wide-angle lenses, lighting, and editing software to showcase spaces accurately and attractively. Smartphone photos simply can't compete with this level of quality.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg my-6">
                  <h4 className="font-semibold text-lg mb-2">Did You Know?</h4>
                  <p>
                    Listings with professional photos receive 61% more views online and sell 32% faster than listings with amateur photos.
                  </p>
                </div>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Comprehensive Visual Tour</h3>
                <p className="mb-4">
                  Professional photographers know how to capture a property from multiple angles to give potential buyers a comprehensive understanding of the space. This reduces surprises during in-person viewings and attracts more serious buyers.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Advanced Photography Techniques</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {photographyTechniques.map((technique, index) => (
                    <div key={index}>
                      <h4 className="font-medium mb-2">{technique.title}</h4>
                      <p className="text-sm">
                        {technique.description}
                      </p>
                    </div>
                  ))}
                </div>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Return on Investment</h3>
                <p className="mb-4">
                  Professional photography typically costs between $100-500 depending on your market and property size. Considering that it can help your property sell faster and potentially for thousands more, it's one of the best investments you can make in the selling process.
                </p>
              </div>
            </article>
          </div>
          
          <div className="lg:col-span-1">
            {/* Sidebar */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">Before & After</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Amateur Photo</p>
                  <img 
                    src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                    alt="Amateur real estate photo" 
                    className="w-full h-40 object-cover rounded" 
                    width="300" 
                    height="160"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Professional Photo</p>
                  <img 
                    src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                    alt="Professional real estate photo" 
                    className="w-full h-40 object-cover rounded" 
                    width="300" 
                    height="160"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
            
            <div className="bg-blue-50 rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Find a Photographer</h3>
              <p className="text-gray-700 mb-4">
                Connect with pre-screened professional real estate photographers in your area.
              </p>
              <Link
                href="/sales"
                className="bg-primary hover:bg-blue-600 text-white font-medium py-2 px-4 rounded inline-block transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
