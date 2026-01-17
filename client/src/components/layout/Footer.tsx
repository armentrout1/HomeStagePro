import { Link } from "wouter";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/roomstagerpro",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <path d="M17.5 6.5h.01" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/roomstagerpro",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.98 3.5a2.5 2.5 0 11-.01 5.001 2.5 2.5 0 01.01-5zm-.24 6.5H9v10H4.74zM10.5 10h4.07v1.54h.06c.57-1.02 1.95-2.1 4.01-2.1 4.29 0 5.08 2.7 5.08 6.2V20h-4.27v-4.95c0-1.18-.02-2.7-1.65-2.7-1.66 0-1.92 1.3-1.92 2.62V20H10.5z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/roomstagerpro",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.4 21v-7.5h2.5l.38-2.9h-2.88V8.4c0-.84.23-1.4 1.42-1.4h1.52V4.36C15.85 4.24 14.95 4 13.9 4c-2.18 0-3.67 1.33-3.67 3.77v2.1H8v2.9h2.24V21h3.16z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://twitter.com/roomstagerpro",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4.5l6.73 7.72L4.18 19.5h3.05l4.58-5.28 3.69 4.28h4.5l-6.99-8.11 6.29-7.18h-3.04l-4.16 4.75L9.77 4.5H4z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <img src="/logo.svg" alt="RoomStagerPro logo" className="h-8 w-8" />
              <h2 className="text-2xl font-semibold">RoomStagerPro</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Expert resources to help property owners showcase their homes at their best and achieve faster sales at better prices.
            </p>
            <div>
              <p className="text-sm text-gray-400">Connect with us on social.</p>
              <div className="mt-4 flex gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 text-gray-300 transition hover:border-white/70 hover:text-white"
                  >
                    <span className="sr-only">{link.name}</span>
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/resources">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">Resources</span>
                </Link>
              </li>
              <li>
                <Link href="/how-it-works">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">How It Works</span>
                </Link>
              </li>
              <li>
                <Link href="/home-staging-tips">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">Home Staging Tips</span>
                </Link>
              </li>
              <li>
                <Link href="/real-estate-photos">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">Photography Guide</span>
                </Link>
              </li>
              <li>
                <Link href="/virtual-vs-traditional">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">Virtual vs Traditional</span>
                </Link>
              </li>
              <li>
                <Link href="/selling-tips">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">Selling Faster Tips</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">About</span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-gray-300 hover:text-white transition cursor-pointer">Contact</span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:aaron@aprkc.com" className="text-gray-300 hover:text-white transition cursor-pointer" title="Email us (routes to aaron@aprkc.com)">
                  info@roomstagerpro.com
                </a>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+18167287548" className="text-gray-300 hover:text-white transition cursor-pointer">
                  (816) 728-7548
                </a>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-4">Newsletter</h3>
            <form className="flex">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-gray-700 text-white px-4 py-2 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500 w-full" 
              />
              <button 
                type="submit" 
                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-r transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} RoomStagerPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
