import { Link } from "wouter";

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
            <p className="text-sm text-gray-400">Connect with us on social once channels launch.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
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
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-300">info@stagingpro.com</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-300">(555) 123-4567</span>
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
