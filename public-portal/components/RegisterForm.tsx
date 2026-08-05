"use client";

import { useState } from "react";
import { registerForEvent } from "@/lib/api";
import type { EventRecord, Registration } from "@/lib/mock-data";

interface Props {
  event: EventRecord;
  onSuccess: (registration: Registration) => void;
}

export function RegisterForm({ event, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event_: React.FormEvent<HTMLFormElement>) {
    event_.preventDefault();
    setError("");
    setLoading(true);
    try {
      const registration = await registerForEvent(event.event_id, {
        participant_name: name,
        email,
        phone: phone || undefined,
      });
      onSuccess(registration);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-primary mb-1">Event Registration</h2>
      <p className="text-sm text-secondary font-medium mb-4">{event.event_name}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Full Name</label>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Email Address</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="participant@email.com"
            className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-on-surface-variant mb-1">Phone Number (Optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 190 9162"
            className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-error bg-error-container/40 border border-error/20 rounded px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary text-on-secondary py-2 rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-60 transition-all"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
