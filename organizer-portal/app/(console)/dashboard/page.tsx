"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";
import { listAllRegistrations, listEvents, type EventRecord, type Registration } from "@/lib/api";

const QUICK_ACTIONS = [
  {
    icon: "add_circle",
    title: "Create Event",
    description: "Set up a new event listing",
    href: "/events/new",
  },
  {
    icon: "group",
    title: "Manage Attendees",
    description: "Review registrations across events",
    href: "/attendees",
  },
  {
    icon: "event",
    title: "View All Events",
    description: "See your full event portfolio",
    href: "/events",
  },
] as const;

export default function DashboardPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listEvents(), listAllRegistrations()])
      .then(([eventList, registrationList]) => {
        setEvents(eventList);
        setRegistrations(registrationList);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const eventsById = useMemo(() => new Map(events.map((event) => [event.event_id, event])), [events]);

  const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0);
  const capacityUsed = totalCapacity > 0 ? Math.round((events.reduce((sum, event) => sum + event.registered_count, 0) / totalCapacity) * 100) : 0;
  const activeEvents = events.filter((event) => event.status !== "cancelled").length;

  const recentRegistrations = [...registrations]
    .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
    .slice(0, 6);

  const topEvent = events.length > 0 ? events.reduce((top, event) => (event.registered_count > top.registered_count ? event : top)) : null;
  const topEventPercent = topEvent && topEvent.capacity > 0 ? Math.round((topEvent.registered_count / topEvent.capacity) * 100) : 0;

  const METRICS = [
    { label: "Total Events", value: String(events.length) },
    { label: "Total Registrations", value: registrations.length.toLocaleString("en-US") },
    { label: "Capacity Used", value: `${capacityUsed}%` },
    { label: "Active Events", value: String(activeEvents) },
  ];

  return (
    <>
      <Topbar searchPlaceholder="Search events..." />
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-semibold text-primary tracking-tight">Event Dashboard</h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Real-time overview of your event portfolio.
            </p>
          </div>
          <span className="bg-primary/5 text-secondary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-secondary/30">
            Live Mode
          </span>
        </div>

        {error && (
          <p className="mb-6 text-sm text-error bg-error-container/40 border border-error/20 rounded px-4 py-3">
            {error}
          </p>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl flex flex-col justify-between h-24 shadow-sm"
            >
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest">{metric.label}</p>
              <h3 className="text-2xl font-semibold text-primary">{loading ? "…" : metric.value}</h3>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h4 className="text-lg font-semibold text-primary">Recent Registrations</h4>
              <Link href="/attendees" className="text-secondary text-xs font-bold hover:underline">
                View All
              </Link>
            </div>
            {!loading && recentRegistrations.length === 0 ? (
              <p className="p-6 text-sm text-on-surface-variant">No registrations yet.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {recentRegistrations.map((registration) => (
                    <tr key={registration.registration_id} className="hover:bg-surface-container-low transition-colors h-12">
                      <td className="px-6 py-2 text-sm text-primary font-medium">{registration.participant_name}</td>
                      <td className="px-6 py-2 text-sm text-on-surface-variant">
                        {eventsById.get(registration.event_id)?.event_name ?? registration.event_id}
                      </td>
                      <td className="px-6 py-2 text-xs text-on-surface-variant">
                        {new Date(registration.registered_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-2">
                        <span
                          className={
                            registration.status === "confirmed"
                              ? "bg-green-100 text-green-700 text-[10px] px-2 py-[2px] rounded font-bold uppercase"
                              : "bg-surface-container-highest text-on-surface-variant text-[10px] px-2 py-[2px] rounded font-bold uppercase"
                          }
                        >
                          {registration.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-primary mb-6">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-4">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="flex items-center justify-between p-4 bg-surface border border-outline-variant rounded-lg hover:border-secondary group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined">{action.icon}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-primary font-bold">{action.title}</p>
                        <p className="text-[11px] text-on-surface-variant">{action.description}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {topEvent && (
              <div className="bg-primary text-on-primary rounded-xl p-6 shadow-sm relative overflow-hidden flex-1">
                <div className="relative z-10">
                  <h4 className="text-[11px] uppercase tracking-widest opacity-70 mb-1">Top Performer</h4>
                  <h3 className="text-xl font-semibold mb-6">{topEvent.event_name}</h3>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="opacity-70">Registrations</span>
                    <span className="font-bold">
                      {topEvent.registered_count}/{topEvent.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full">
                    <div
                      className="bg-secondary-container h-full rounded-full"
                      style={{ width: `${topEventPercent}%` }}
                    />
                  </div>
                </div>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 opacity-10 text-[140px]">
                  auto_awesome
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
