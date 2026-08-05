"use client";

import { useState } from "react";
import { createRegistration, type EventRecord, type Registration } from "@/lib/api";

interface AddAttendeeModalProps {
  events: EventRecord[];
  onClose: () => void;
  onCreated: (registration: Registration) => void;
}

export function AddAttendeeModal({ events, onClose, onCreated }: AddAttendeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const eventId = String(form.get("event_id") ?? "");
    if (!eventId) {
      setError("Select an event.");
      return;
    }
    setLoading(true);
    try {
      const registration = await createRegistration(eventId, {
        participant_name: String(form.get("participant_name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
      });
      onCreated(registration);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add attendee.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-base font-semibold text-primary">Add Attendee</h3>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Event</label>
            <select
              required
              name="event_id"
              className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Full Name</label>
            <input
              required
              name="participant_name"
              type="text"
              placeholder="Jane Doe"
              className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Email Address</label>
            <input
              required
              name="email"
              type="email"
              placeholder="jane.doe@example.com"
              className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Phone (optional)</label>
            <input
              name="phone"
              type="tel"
              placeholder="+1 555 555 0148"
              className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-error bg-error-container/40 border border-error/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-outline-variant text-primary font-bold text-xs hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded bg-secondary text-on-secondary font-bold text-xs hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {loading ? "Adding..." : "Add Attendee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
