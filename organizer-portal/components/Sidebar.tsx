"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/events", label: "Events", icon: "event" },
  { href: "/attendees", label: "Attendees", icon: "group" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 flex flex-col pt-6 pb-4 w-[240px] h-screen bg-surface-bright border-r border-outline-variant z-50">
      <div className="px-4 mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary text-[20px]">cloud</span>
        </div>
        <div>
          <h1 className="text-[20px] leading-tight font-semibold text-primary">Organizer Console</h1>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
            Enterprise Management
          </p>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-4 px-4 py-2 rounded-lg text-primary font-bold border-l-4 border-secondary bg-surface-container text-[12px] transition-all"
                  : "flex items-center gap-4 px-4 py-2 rounded-lg text-on-surface-variant font-medium text-[12px] hover:bg-surface-container-highest hover:text-primary transition-all"
              }
            >
              <span
                className="material-symbols-outlined"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 mt-auto space-y-1">
        <Link
          href="/events/new"
          className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary py-2 px-4 rounded font-bold text-[12px] hover:opacity-90 transition-opacity mb-4"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Event
        </Link>
        <div className="pt-4 border-t border-outline-variant space-y-1">
          <span className="flex items-center gap-4 px-4 py-2 rounded-lg text-on-surface-variant font-medium text-[12px] opacity-60 cursor-default">
            <span className="material-symbols-outlined">menu_book</span>
            Documentation
          </span>
          <span className="flex items-center gap-4 px-4 py-2 rounded-lg text-on-surface-variant font-medium text-[12px] opacity-60 cursor-default">
            <span className="material-symbols-outlined">support_agent</span>
            Support
          </span>
        </div>
      </div>
    </aside>
  );
}
