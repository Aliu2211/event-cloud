"use client";

import { useState } from "react";
import { createSession, type Session, type Speaker } from "@/lib/api";

interface AddSessionModalProps {
  eventId: string;
  speakers: Speaker[];
  onClose: () => void;
  onCreated: (session: Session) => void;
}

export function AddSessionModal({ eventId, speakers, onClose, onCreated }: AddSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const speakerId = String(form.get("speaker_id") ?? "");
    setLoading(true);
    try {
      const session = await createSession(eventId, {
        day: String(form.get("day") ?? ""),
        time: String(form.get("time") ?? ""),
        title: String(form.get("title") ?? ""),
        location: String(form.get("location") ?? ""),
        description: String(form.get("description") ?? ""),
        track: String(form.get("track") ?? ""),
        speaker_id: speakerId || undefined,
      });
      onCreated(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-base font-semibold text-primary">Add Session</h3>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-primary">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Day</label>
              <input
                required
                name="day"
                type="text"
                placeholder="Day 1: Sep 14"
                className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Time</label>
              <input
                required
                name="time"
                type="text"
                placeholder="09:00 AM"
                className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Title</label>
            <input
              required
              name="title"
              type="text"
              placeholder="Keynote: Architecting for Scale"
              className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Description</label>
            <textarea
              name="description"
              rows={2}
              placeholder="What this session covers..."
              className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Location</label>
              <input
                required
                name="location"
                type="text"
                placeholder="Main Hall A"
                className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-on-surface-variant mb-1">Track</label>
              <input
                name="track"
                type="text"
                placeholder="Technical"
                className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-on-surface-variant mb-1">Speaker</label>
            <select
              name="speaker_id"
              className="w-full border border-outline px-4 py-2 rounded text-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none"
            >
              <option value="">No speaker assigned</option>
              {speakers.map((speaker) => (
                <option key={speaker.speaker_id} value={speaker.speaker_id}>
                  {speaker.name}
                </option>
              ))}
            </select>
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
              {loading ? "Adding..." : "Add Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
