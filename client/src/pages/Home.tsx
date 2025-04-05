import { Link } from "wouter";
import { StarRating } from "@/components/ui/star-rating";

export default function Home() {
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Faster Sales",
      description: "Well-staged homes sell up to 73% faster than non-staged properties.",
      color: "text-primary"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Higher Value",
      description: "Professionally staged properties can sell for 5-15% more than the asking price.",
      color: "text-secondary"
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      title: "Better Impressions",
      description: "90% of buyers form their opinion within the first 90 seconds of viewing a property.",
      color: "text-accent"
    }
  ];

  const articles = [
    {
      title: "10 Essential Home Staging Tips",
      description: "Learn the key techniques professionals use to make homes irresistible to buyers.",
      image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      readTime: "5 min read",
      link: "/home-staging-tips"
    },
    {
      title: "Why Professional Photos Matter",
      description: "Discover how quality photography can dramatically increase buyer interest.",
      image: "https://images.unsplash.com/photo-1598928636135-d146006ff4be?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      readTime: "4 min read",
      link: "/real-estate-photos"
    },
    {
      title: "Virtual vs Traditional Staging",
      description: "Compare the costs, benefits, and results of traditional and virtual staging options.",
      image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      readTime: "6 min read",
      link: "/virtual-vs-traditional"
    }
  ];

  const testimonials = [
    {
      text: "After following the staging tips, our house sold in just 5 days for $20,000 over asking price. The professional photos made all the difference in attracting serious buyers.",
      name: "Sarah Thompson",
      location: "San Francisco, CA",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    },
    {
      text: "We tried selling our home for months with no success. After implementing virtual staging based on your guide, we had multiple offers within two weeks. The transformation was incredible!",
      name: "Michael Rodriguez",
      location: "Chicago, IL",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                Perfect Staging, Perfect Sale
              </h1>
              <p className="text-lg text-gray-700 mb-6">
                Elevate your property's appeal with professional staging techniques and expert advice for a faster sale at the best price.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Link href="/home-staging-tips">
                  <a className="bg-primary hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition shadow-sm inline-block text-center">
                    Staging Tips
                  </a>
                </Link>
                <Link href="/selling-tips">
                  <a className="bg-white hover:bg-gray-100 text-gray-800 font-medium py-3 px-6 rounded-lg transition border border-gray-300 shadow-sm inline-block text-center">
                    Selling Guide
                  </a>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Beautifully staged living room" 
                className="rounded-lg shadow-lg" 
                width="600" 
                height="400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Staging Matters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 shadow-sm hover:shadow-md transition">
                <div className={`${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Articles */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Recent Articles</h2>
            <Link href="/home-staging-tips">
              <a className="text-primary hover:text-blue-700 font-medium flex items-center">
                View all
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </a>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <Link key={index} href={article.link}>
                <a className="group">
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition">
                    <img 
                      src={article.image} 
                      alt={article.title} 
                      className="w-full h-48 object-cover" 
                      width="400" 
                      height="192"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition">{article.title}</h3>
                      <p className="text-gray-700 mb-4">{article.description}</p>
                      <span className="text-sm text-gray-500">{article.readTime}</span>
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Clients Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <StarRating rating={5} />
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="mr-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                      className="h-10 w-10 rounded-full object-cover" 
                      width="40" 
                      height="40"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Property?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Explore our comprehensive guides and make your home irresistible to buyers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/home-staging-tips">
              <a className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 px-8 rounded-lg transition shadow-sm inline-block">
                Get Started
              </a>
            </Link>
            <Link href="/selling-tips">
              <a className="bg-transparent hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition border border-white inline-block">
                Learn More
              </a>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
