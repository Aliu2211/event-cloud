"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Explore" },
  { href: "/my-tickets", label: "My Tickets" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest border-b border-outline-variant">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">cloud</span>
          </div>
          <span className="text-lg font-semibold text-primary">EventCloud</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 flex-1">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "text-sm font-semibold text-primary border-b-2 border-secondary h-16 flex items-center"
                    : "text-sm text-on-surface-variant hover:text-primary h-16 flex items-center transition-colors"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/#events"
          className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
        >
          Register Now
        </Link>
      </div>
    </header>
  );
}
