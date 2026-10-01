import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "wouter";
interface MobileMenuProps {
  isOpen: boolean; navLinks: { href: string; label: string }[]; currentPath: string;
  onClose: () => void; triggerRef?: React.RefObject<HTMLButtonElement>; onStagerCtaClick?: () => void;
}
export default function MobileMenu({ isOpen, navLinks, currentPath, onClose, triggerRef, onStagerCtaClick }: MobileMenuProps) {
  return <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
      <Dialog.Content id="mobile-navigation" aria-describedby={undefined}
        onCloseAutoFocus={(event) => { event.preventDefault(); triggerRef?.current?.focus(); }}
        className="fixed right-0 top-0 z-[60] h-dvh w-[min(320px,90vw)] overflow-y-auto rounded-l-3xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <Dialog.Title className="text-lg font-semibold">RoomStagerPro menu</Dialog.Title>
          <Dialog.Close className="min-h-11 min-w-11 rounded border" aria-label="Close menu">✕</Dialog.Close>
        </div>
        <nav className="mt-6 space-y-2" aria-label="Mobile navigation">
          {navLinks.map((link) => <Link key={link.href} href={link.href} onClick={onClose}
            aria-current={currentPath === link.href ? "page" : undefined}
            className="block rounded-xl px-4 py-3 font-medium hover:bg-slate-100 focus-visible:outline focus-visible:outline-2">
            {link.label}
          </Link>)}
          <button className="mt-4 min-h-12 w-full rounded-full border border-amber-400 px-4 font-medium"
            onClick={() => { onClose(); onStagerCtaClick?.(); }}>Open room stager</button>
        </nav>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
