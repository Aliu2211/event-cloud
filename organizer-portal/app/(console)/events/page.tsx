"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { listEvents, type EventRecord, type EventStatus } from "@/lib/api";

const STATUS_STYLES: Record<EventStatus, string> = {
  available: "bg-green-100 text-green-700",
  limited: "bg-secondary-container/40 text-secondary",
  full: "bg-primary-fixed text-primary",
  cancelled: "bg-error-container text-on-error-container",
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load events"))
      .finally(() => setLoading(false));
  }, []);

  const totalRegistrations = events.reduce((sum, event) => sum + event.registered_count, 0);
  const fullCount = events.filter((event) => event.status === "full").length;
  const cancelledCount = events.filter((event) => event.status === "cancelled").length;

  return (
    <>
      <Topbar searchPlaceholder="Search events..." />
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <nav className="flex items-center gap-1 text-on-surface-variant text-xs mb-1">
                <span className="opacity-60">Management</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-primary font-semibold">Events</span>
              </nav>
              <h2 className="text-2xl font-semibold text-primary">All Events</h2>
              <p className="text-on-surface-variant text-sm max-w-2xl">
                Monitor and manage your events. Track real-time registrations and status across your
                portfolio.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 border border-outline-variant rounded-lg flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-on-surface-variant">Showing {events.length} events</p>
          </div>
        </div>

        {error && (
          <p className="mb-6 text-sm text-error bg-error-container/40 border border-error/20 rounded px-4 py-3">
            {error}
          </p>
        )}

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Event Name
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Registrations
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-primary uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                    No events yet.{" "}
                    <Link href="/events/new" className="text-secondary font-semibold hover:underline">
                      Create your first event
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {events.map((event) => {
                const percent = event.capacity > 0 ? Math.round((event.registered_count / event.capacity) * 100) : 0;
                return (
                  <tr key={event.event_id} className="border-b border-outline-variant last:border-b-0">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        {event.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.image_url}
                            alt=""
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-primary-container flex-shrink-0 flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-container">event</span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-primary block">{event.event_name}</span>
                          <span className="text-xs text-on-surface-variant">{event.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-on-surface-variant">{event.date}</td>
                    <td className="px-6 py-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold uppercase ${STATUS_STYLES[event.status]}`}
                      >
                        {event.status === "available" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                        )}
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="w-32">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>
                            {event.registered_count} / {event.capacity}
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-secondary-container" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <Link
                        href={`/events/${event.event_id}`}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors rounded inline-flex"
                        title="View event"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined p-2 bg-secondary/10 text-secondary rounded-lg">
                confirmation_number
              </span>
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Total Registrations</p>
              <h3 className="text-xl font-semibold text-primary">{totalRegistrations.toLocaleString("en-US")}</h3>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined p-2 bg-primary/5 text-primary rounded-lg">
                event_busy
              </span>
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Sold Out Events</p>
              <h3 className="text-xl font-semibold text-primary">
                {fullCount} <span className="text-on-surface-variant text-sm font-normal">/ {events.length}</span>
              </h3>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant flex flex-col gap-2 relative overflow-hidden">
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 opacity-5 text-[120px] pointer-events-none">
              bar_chart
            </span>
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined p-2 bg-tertiary/5 text-tertiary rounded-lg">
                cancel
              </span>
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wide">Cancelled Events</p>
              <h3 className="text-xl font-semibold text-primary">
                {cancelledCount} <span className="text-on-surface-variant text-sm font-normal">/ {events.length}</span>
              </h3>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
