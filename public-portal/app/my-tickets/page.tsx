"use client";

import { useState } from "react";
import Link from "next/link";
import { getEvent, getRegistrationsByEmail } from "@/lib/api";
import type { EventRecord, Registration } from "@/lib/mock-data";

interface ResultRow {
  registration: Registration;
  event: EventRecord | null;
}

export default function MyTicketsPage() {
  const [email, setEmail] = useState("");
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError("");
    setLoading(true);
    try {
      const registrations = await getRegistrationsByEmail(email);
      const rows = await Promise.all(
        registrations.map(async (registration) => ({
          registration,
          event: await getEvent(registration.event_id),
        })),
      );
      setResults(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to look up tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 w-full">
      <h1 className="text-2xl font-bold text-primary mb-1 text-center">My Tickets</h1>
      <p className="text-sm text-on-surface-variant text-center mb-8">
        Enter the email you registered with to find your tickets.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-secondary text-on-secondary px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0"
        >
          {loading ? "Searching..." : "Find My Tickets"}
        </button>
      </form>

      {error && <p className="text-sm text-error text-center mb-6">{error}</p>}

      {results && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center">
              No tickets found for that email. Try the address you used when registering.
            </p>
          ) : (
            results.map(({ registration, event }) => (
              <Link
                key={registration.registration_id}
                href={`/ticket/${registration.registration_id}`}
                className="block bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-secondary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary">{event?.event_name ?? "Unknown event"}</p>
                    <p className="text-xs text-on-surface-variant">{event?.date_range}</p>
                  </div>
                  <span className="font-mono text-xs text-secondary">{registration.ticket_number}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
