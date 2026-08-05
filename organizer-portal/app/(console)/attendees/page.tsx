"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { AddAttendeeModal } from "@/components/AddAttendeeModal";
import { listAllRegistrations, listEvents, type EventRecord, type Registration } from "@/lib/api";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toCsv(rows: Registration[], eventsById: Map<string, EventRecord>): string {
  const header = ["Name", "Email", "Event", "Ticket Number", "Status", "Registered At"];
  const lines = rows.map((row) =>
    [
      row.participant_name,
      row.email,
      eventsById.get(row.event_id)?.event_name ?? row.event_id,
      row.ticket_number,
      row.status,
      row.registered_at,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export default function AttendeesPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState(() =>
    typeof window === "undefined" ? "all" : new URLSearchParams(window.location.search).get("event") ?? "all",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddAttendee, setShowAddAttendee] = useState(false);

  useEffect(() => {
    Promise.all([listEvents(), listAllRegistrations()])
      .then(([eventList, registrationList]) => {
        setEvents(eventList);
        setRegistrations(registrationList);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load attendees"))
      .finally(() => setLoading(false));
  }, []);

  const eventsById = useMemo(() => new Map(events.map((event) => [event.event_id, event])), [events]);

  const filtered = registrations.filter((registration) => {
    if (eventFilter !== "all" && registration.event_id !== eventFilter) return false;
    if (statusFilter !== "all" && registration.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      if (
        !registration.participant_name.toLowerCase().includes(term) &&
        !registration.email.toLowerCase().includes(term)
      ) {
        return false;
      }
    }
    return true;
  });

  const confirmedCount = registrations.filter((r) => r.status === "confirmed").length;
  const cancelledCount = registrations.filter((r) => r.status === "cancelled").length;
  const eventsRepresented = new Set(registrations.map((r) => r.event_id)).size;

  function handleExportCsv() {
    const csv = toCsv(filtered, eventsById);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendees.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Topbar searchPlaceholder="Search events, tickets, or attendees..." />
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Manage Attendees</h2>
            <p className="text-sm text-on-surface-variant">Review registration status across your events.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-primary rounded-lg text-xs hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowAddAttendee(true)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary font-bold rounded-lg text-xs hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Attendee
            </button>
          </div>
        </header>

        {error && (
          <p className="mb-6 text-sm text-error bg-error-container/40 border border-error/20 rounded px-4 py-3">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Total Registrants</p>
            <p className="text-3xl font-bold text-primary">{registrations.length.toLocaleString("en-US")}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-secondary">{confirmedCount.toLocaleString("en-US")}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Cancelled</p>
            <p className="text-3xl font-bold text-error">{cancelledCount.toLocaleString("en-US")}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Events Represented</p>
            <p className="text-3xl font-bold text-primary">{eventsRepresented}</p>
          </div>
        </div>

        <section className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant mb-4 flex flex-wrap items-center gap-4 shadow-sm">
          <div className="flex-1 min-w-[200px] relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-surface border border-outline-variant rounded-lg pl-8 pr-4 py-2 text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
              placeholder="Search by name or email..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-on-surface-variant">EVENT</label>
            <select
              value={eventFilter}
              onChange={(event) => setEventFilter(event.target.value)}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-secondary/30 outline-none"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-on-surface-variant">STATUS</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="bg-surface border border-outline-variant rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-secondary/30 outline-none"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Attendee Name
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Email Address
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Registration Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                    No attendees match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((registration) => (
                <tr key={registration.registration_id} className="hover:bg-surface-container-low transition-colors h-14">
                  <td className="px-6 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-xs font-bold">
                        {initials(registration.participant_name)}
                      </div>
                      <span className="text-sm font-medium text-primary">{registration.participant_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-2 text-sm text-on-surface-variant">{registration.email}</td>
                  <td className="px-6 py-2 text-sm text-on-surface-variant">
                    {eventsById.get(registration.event_id)?.event_name ?? registration.event_id}
                  </td>
                  <td className="px-6 py-2">
                    {registration.status === "confirmed" ? (
                      <span className="flex items-center gap-1 text-green-700 text-sm">
                        <span className="w-2 h-2 rounded-full bg-green-600" />
                        Confirmed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-error text-sm">
                        <span className="w-2 h-2 rounded-full bg-error" />
                        Cancelled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-2 text-sm text-on-surface-variant">
                    {new Date(registration.registered_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              Showing {filtered.length} of {registrations.length} entries
            </span>
          </div>
        </section>
      </div>

      {showAddAttendee && (
        <AddAttendeeModal
          events={events}
          onClose={() => setShowAddAttendee(false)}
          onCreated={(registration) => {
            setRegistrations((prev) => [...prev, registration]);
            setShowAddAttendee(false);
          }}
        />
      )}
    </>
  );
}
