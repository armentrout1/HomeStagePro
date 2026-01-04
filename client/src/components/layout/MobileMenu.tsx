import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";

interface MobileMenuProps {
  isOpen: boolean;
  navLinks: { href: string; label: string }[];
  currentPath: string;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  onStagerCtaClick?: () => void;
}

export default function MobileMenu({
  isOpen,
  navLinks,
  currentPath,
  onClose,
  triggerRef,
  onStagerCtaClick,
}: MobileMenuProps) {
  const [renderMenu, setRenderMenu] = useState(isOpen);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRenderMenu(true);
    } else {
      const timeout = setTimeout(() => setRenderMenu(false), 250);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";

    const focusTarget = closeButtonRef.current ?? panelRef.current?.querySelector<HTMLElement>("a,button");
    focusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.removeProperty("overflow");
    };
  }, [isOpen, onClose, triggerRef]);

  if (!renderMenu) return null;

  const handleLinkClick = () => {
    onClose();
  };

  const handleStagerCtaPress = () => {
    onClose();
    onStagerCtaClick?.();
  };

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 right-0 z-[60] h-full w-[280px] sm:w-[320px] max-w-sm border-l border-slate-200 bg-white shadow-xl rounded-l-3xl transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="RoomStagerPro logo" className="h-8 w-8" />
            <span className="text-lg font-semibold text-slate-900">RoomStagerPro</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-2 px-3 pb-8">
          <ul className="space-y-2">
            {navLinks.map((link) => {
              const isActive = currentPath === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={handleLinkClick}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative flex min-h-[44px] items-center rounded-xl border border-transparent px-5 py-3 text-base font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                      isActive
                        ? "bg-slate-50 text-primary"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-2 bottom-2 w-1 rounded-full bg-primary transition-opacity ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                      }`}
                    />
                    <span className="pl-2">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleStagerCtaPress}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-amber-400 px-5 text-base font-medium text-slate-900 ring-1 ring-amber-200 transition hover:bg-amber-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Try AI Stager
            </button>
          </div>
        </nav>
      </div>
    </>,
    document.body
  );
}
