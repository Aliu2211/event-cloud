"use client";

import type { EventRecord, Registration } from "@/lib/mock-data";

export function TicketView({ registration, event }: { registration: Registration; event: EventRecord }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden print:shadow-none">
      <div className="bg-primary text-white p-6 text-center">
        <span className="material-symbols-outlined text-3xl text-secondary-container">confirmation_number</span>
        <p className="text-xs uppercase tracking-widest text-white/60 mt-2">Ticket Number</p>
        <p className="text-2xl font-mono font-bold tracking-wider mt-1">{registration.ticket_number}</p>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <p className="text-xs text-on-surface-variant uppercase tracking-wide">Event</p>
          <p className="text-lg font-semibold text-primary">{event.event_name}</p>
          <p className="text-sm text-on-surface-variant">
            {event.date_range} · {event.location}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant">
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Attendee</p>
            <p className="text-sm font-medium text-primary">{registration.participant_name}</p>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Email</p>
            <p className="text-sm font-medium text-primary">{registration.email}</p>
          </div>
          {registration.phone && (
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-wide">Phone</p>
              <p className="text-sm font-medium text-primary">{registration.phone}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wide">Status</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              {registration.status === "confirmed" ? "Confirmed" : "Cancelled"}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
          <p className="text-xs text-on-surface-variant">
            Registration ID <span className="font-mono">{registration.registration_id}</span>
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
