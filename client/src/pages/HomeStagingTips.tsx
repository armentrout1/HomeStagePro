import { Link } from "wouter";

export default function HomeStagingTips() {
  const relatedResources = [
    { title: "Why Professional Photos Matter", path: "/real-estate-photos" },
    { title: "Virtual vs Traditional Staging", path: "/virtual-vs-traditional" },
    { title: "Tips for Selling Faster", path: "/selling-tips" }
  ];

  return (
    <>
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Home Staging Tips</h1>
          <p className="text-xl text-gray-700 max-w-4xl">
            Discover professional techniques to showcase your property's full potential and make a lasting impression on potential buyers.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Main Content */}
            <article className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">10 Essential Home Staging Tips</h2>
              
              <img 
                src="https://images.unsplash.com/photo-1560440021-33f9b867899d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                alt="Beautifully staged living room" 
                className="w-full h-64 object-cover rounded-lg mb-6" 
                width="800" 
                height="256"
              />
              
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  Home staging is the art of preparing a property for sale by highlighting its best features and creating an emotional connection with potential buyers. Here are our top 10 staging tips to help your property sell faster and for a higher price.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">1. Declutter and Depersonalize</h3>
                <p className="mb-4">
                  Remove personal items, family photos, and clutter. Buyers need to envision themselves living in the space, not feel like they're touring someone else's home.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">2. Deep Clean Everything</h3>
                <p className="mb-4">
                  A spotless home suggests that the property has been well-maintained. Pay special attention to kitchens, bathrooms, and floors.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">3. Maximize Natural Light</h3>
                <p className="mb-4">
                  Open all curtains and blinds. Clean windows to let in maximum natural light, which makes spaces feel larger and more inviting.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">4. Update Lighting Fixtures</h3>
                <p className="mb-4">
                  Replace outdated lighting fixtures with modern options. Ensure all bulbs work and provide warm, flattering light.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">5. Rearrange Furniture</h3>
                <p className="mb-4">
                  Create conversational groupings and ensure furniture placement showcases the room's purpose while maximizing perceived space.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">6. Neutral Color Palette</h3>
                <p className="mb-4">
                  Repaint bold-colored walls with neutral tones. This creates a blank canvas that appeals to most buyers and makes spaces feel larger.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">7. Update Kitchen and Bathrooms</h3>
                <p className="mb-4">
                  These rooms often sell homes. Simple updates like new hardware, fixtures, or a fresh coat of paint can transform these spaces without major renovations.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">8. Enhance Curb Appeal</h3>
                <p className="mb-4">
                  First impressions matter. Clean up landscaping, paint the front door, and add potted plants to create an inviting entrance.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">9. Add Strategic Accessories</h3>
                <p className="mb-4">
                  Use pillows, throws, and décor items to add pops of color and texture. Keep it minimal but impactful.
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">10. Create Lifestyle Vignettes</h3>
                <p className="mb-4">
                  Set the dining table, place a book and throw on a chair, or add a bottle of wine with glasses on the patio. These touches help buyers envision living in the space.
                </p>
              </div>
            </article>
          </div>
          
          <div className="lg:col-span-1">
            {/* Sidebar */}
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
              <h3 className="text-xl font-semibold mb-4">Need Professional Help?</h3>
              <p className="text-gray-700 mb-4">
                Our network of certified home stagers can transform your property for maximum appeal.
              </p>
              <Link
                href="/virtual-staging"
                className="bg-primary hover:bg-blue-600 text-white font-medium py-2 px-4 rounded inline-block transition"
              >
                Find a Stager
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
