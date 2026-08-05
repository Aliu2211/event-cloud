"use client";

import { useState } from "react";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { TicketView } from "./TicketView";
import type { EventRecord, Registration } from "@/lib/mock-data";

export function EventRegistration({ event }: { event: EventRecord }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const selectable = event.status === "available" || event.status === "limited";

  if (registration) {
    return (
      <div>
        <div className="flex items-center gap-2 text-green-700 mb-4">
          <span className="material-symbols-outlined">check_circle</span>
          <p className="text-sm font-semibold">Registration confirmed</p>
        </div>
        <TicketView registration={registration} event={event} />
        <Link
          href={`/ticket/${registration.registration_id}`}
          className="block text-center text-sm text-secondary font-medium hover:underline mt-4"
        >
          View this ticket anytime at /ticket/{registration.registration_id}
        </Link>
      </div>
    );
  }

  if (!selectable) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">event_busy</span>
        <p className="text-sm font-semibold text-primary mt-2">
          {event.status === "full" ? "This event is full" : "This event has been cancelled"}
        </p>
        <p className="text-sm text-on-surface-variant mt-1">
          {event.status === "full"
            ? "Check back later in case a spot opens up."
            : "Registration is closed for this event."}
        </p>
      </div>
    );
  }

  return <RegisterForm event={event} onSuccess={setRegistration} />;
}
