"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { currentUser, logout } from "@/lib/auth";

interface TopbarTab {
  label: string;
  href: string;
  active?: boolean;
}

interface TopbarProps {
  searchPlaceholder?: string;
  tabs?: TopbarTab[];
}

function initials(value: string): string {
  const [name] = value.split("@");
  return name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar({ searchPlaceholder = "Search events...", tabs }: TopbarProps) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentUser().then((user) => {
      if (user) setLabel(user.signInDetails?.loginId ?? user.username);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 gap-4 w-full h-16 bg-surface-container-lowest border-b border-outline-variant">
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            placeholder={searchPlaceholder}
            type="text"
          />
        </div>
      </div>

      {tabs && (
        <nav className="hidden md:flex items-center gap-6">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                tab.active
                  ? "text-primary font-bold border-b-2 border-secondary h-16 flex items-center px-2 text-sm"
                  : "text-on-surface-variant hover:bg-surface-container-low px-2 h-16 flex items-center transition-colors text-sm"
              }
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-4">
        <Link
          href="/events/new"
          className="bg-secondary text-on-secondary px-6 py-2 rounded font-bold text-[12px] hover:opacity-90 active:opacity-80 transition-all"
        >
          Create Event
        </Link>
        <div className="flex items-center gap-2 relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="w-8 h-8 rounded-full ml-2 bg-primary-container text-on-primary-container flex items-center justify-center text-[11px] font-bold border border-outline-variant hover:opacity-90 transition-opacity"
            aria-label="Account menu"
          >
            {label ? initials(label) : ""}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 w-56 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1 z-50">
              <p className="px-4 py-2 text-xs text-on-surface-variant truncate border-b border-outline-variant">
                {label}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-surface-container-low transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
