import { Link } from "wouter";

interface MobileMenuProps {
  isOpen: boolean;
  navLinks: { href: string; label: string }[];
  currentPath: string;
}

export default function MobileMenu({ isOpen, navLinks, currentPath }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white pb-4 px-4">
      <ul className="space-y-3">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>
              <a className={`block py-2 ${currentPath === link.href ? 'text-primary' : 'text-gray-700'} hover:text-primary transition`}>
                {link.label}
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
