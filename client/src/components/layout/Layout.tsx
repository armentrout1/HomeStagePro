import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

const SCROLL_TARGET_HASH = "#ai-stager";

export default function Layout({ children }: LayoutProps) {
  const [rawLocation] = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const [path, hash = ""] = rawLocation.split("#");
    if (path !== "/") return;
    if (`#${hash}` !== SCROLL_TARGET_HASH) return;

    let cancelled = false;
    let rafId: number;

    const attemptScroll = (triesLeft: number) => {
      if (cancelled) return;
      const target = document.getElementById(SCROLL_TARGET_HASH.substring(1));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (triesLeft > 0) {
        rafId = window.requestAnimationFrame(() => attemptScroll(triesLeft - 1));
      }
    };

    rafId = window.requestAnimationFrame(() => attemptScroll(12));

    return () => {
      cancelled = true;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [rawLocation]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800 bg-slate-50">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
