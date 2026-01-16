import { Suspense, lazy, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { StarRating } from "@/components/ui/star-rating";

const ImageStager = lazy(() => import("@/components/ImageStager"));

export default function Home() {
  const scrollToStager = useCallback(() => {
    if (typeof document === "undefined") return;

    let attempts = 0;
    const maxAttempts = 20;

    const tryScroll = () => {
      const el = document.getElementById("ai-stager");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryScroll);
      }
    };

    tryScroll();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#ai-stager") {
        scrollToStager();
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [scrollToStager]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem("scrollToAiStager") === "1") {
      sessionStorage.removeItem("scrollToAiStager");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToStager();
          window.history.replaceState(null, "", "/#ai-stager");
        });
      });
    }
  }, [scrollToStager]);

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
      image: "/home/article-1.webp",
      readTime: "5 min read",
      link: "/home-staging-tips"
    },
    {
      title: "Why Professional Photos Matter",
      description: "Discover how quality photography can dramatically increase buyer interest.",
      image: "/home/article-2.webp",
      readTime: "4 min read",
      link: "/real-estate-photos"
    },
    {
      title: "Virtual vs Traditional Staging",
      description: "Compare the costs, benefits, and results of traditional and virtual staging options.",
      image: "/home/article-3.webp",
      readTime: "6 min read",
      link: "/virtual-vs-traditional"
    }
  ];

  const testimonials = [
    {
      text: "After following the staging tips, our house sold in just 5 days for $20,000 over asking price. The professional photos made all the difference in attracting serious buyers.",
      name: "Sarah Thompson",
      location: "San Francisco, CA",
      image: "/home/testimonial-1.webp"
    },
    {
      text: "We tried selling our home for months with no success. After implementing virtual staging based on your guide, we had multiple offers within two weeks. The transformation was incredible!",
      name: "Michael Rodriguez",
      location: "Chicago, IL",
      image: "/home/testimonial-2.webp"
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200/70">
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
                <Link
                  href="/#ai-stager"
                  onClick={(event) => {
                    event.preventDefault();
                    scrollToStager();
                    window.history.pushState(null, "", "/#ai-stager");
                  }}
                >
                  <span className="inline-flex items-center justify-center rounded-full border border-amber-400 bg-amber-400/90 px-6 py-3 text-base font-semibold text-slate-900 ring-1 ring-amber-200 shadow-sm transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2">
                    Try AI Stager
                  </span>
                </Link>
                <Link href="/sales">
                  <span className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2">
                    See Pricing
                  </span>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <img
                src="/hero/home-hero-v2.webp"
                alt="Beautifully staged living room"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width="1600"
                height="1067"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Image Stager Section */}
      <section id="ai-stager" className="py-16 md:py-12 bg-slate-50 border-t border-slate-200/70">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-[2.65rem] font-bold text-center mb-8 md:mb-6">Try Our AI Room Staging Tool</h2>
          <p className="text-lg md:text-xl text-gray-600 text-center mb-12 md:mb-9 max-w-3xl mx-auto">
            Upload a photo of your empty room and watch as our AI transforms it into a beautifully staged space. See the potential of your property in seconds!
          </p>
          <Suspense
            fallback={
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center text-base text-gray-500 shadow-sm">
                Loading stager…
              </div>
            }
          >
            <ImageStager />
          </Suspense>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200/70">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Staging Matters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="pp-card border border-slate-300 shadow-md rounded-2xl p-6 md:p-8 transition hover:shadow-lg"
              >
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
      <section className="py-16 bg-slate-50 border-t border-slate-200/70">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Recent Articles</h2>
            <Link href="/home-staging-tips">
              <span className="text-primary hover:text-blue-700 font-medium flex items-center cursor-pointer">
                View all
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <Link key={index} href={article.link}>
                <div className="group cursor-pointer">
                  <div className="pp-card border border-slate-300 shadow-md rounded-2xl overflow-hidden transition group-hover:shadow-lg">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-48 object-cover"
                      width="400"
                      height="192"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="p-6 md:p-8">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition">{article.title}</h3>
                      <p className="text-gray-700 mb-4">{article.description}</p>
                      <span className="text-sm text-gray-500">{article.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white border-t border-slate-200/70">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Clients Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="pp-card border border-slate-300 shadow-md rounded-2xl p-6 md:p-8"
              >
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
                      loading="lazy"
                      decoding="async"
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
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-t border-slate-200/70 border-b border-slate-200/70">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Property?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Explore our comprehensive guides and make your home irresistible to buyers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/home-staging-tips">
              <span className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 px-8 rounded-lg transition shadow-sm inline-block cursor-pointer">
                Staging Tips
              </span>
            </Link>
            <Link href="/selling-tips">
              <span className="bg-transparent hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition border border-white inline-block cursor-pointer">
                Selling Guide
              </span>
            </Link>
          </div>
        </div>
      </section>
      
    </>
  );
}
