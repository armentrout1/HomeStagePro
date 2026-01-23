import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [rawLocation, navigate] = useLocation();
  const currentPath = rawLocation.split("#")[0] || rawLocation;
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { href: "/", label: "AI Stager" },
    { href: "/gallery", label: "Gallery" },
    { href: "/resources", label: "Resources" },
    { href: "/sales", label: "Pricing" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const baseHeaderClasses =
    "sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm transition-shadow";

  const scrollToStagerSection = () => {
    if (typeof window === "undefined") return;
    const target = document.getElementById("ai-stager");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAiStagerClick = () => {
    navigate("/#ai-stager");
    if (currentPath === "/") {
      scrollToStagerSection();
    }
  };

  return (
    <header className={`${baseHeaderClasses} ${hasScrolled ? "shadow-sm" : ""}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="RoomStagerPro logo" className="h-8 w-8" />
          <span className="text-xl font-semibold text-slate-900">RoomStagerPro</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const isActive = currentPath === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative inline-flex items-center text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  isActive ? "text-primary" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-primary transition-all duration-200 ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleAiStagerClick}
            className="inline-flex items-center rounded-full border border-amber-400 px-4 py-2 text-sm font-medium text-slate-900 ring-1 ring-amber-200 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          >
            Try AI Stager
          </button>
        </nav>
        <button
          ref={mobileTriggerRef}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300 p-0 text-amber-700 shadow-sm transition-transform duration-200 ease-out hover:scale-[1.03] active:scale-[0.97] hover:border-amber-400 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
      <MobileMenu
        isOpen={isMobileMenuOpen}
        navLinks={navLinks}
        currentPath={currentPath}
        onClose={() => setIsMobileMenuOpen(false)}
        triggerRef={mobileTriggerRef}
        onStagerCtaClick={handleAiStagerClick}
      />
    </header>
  );
}