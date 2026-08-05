"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { createEvent, uploadEventImage } from "@/lib/api";

export default function CreateEventPage() {
  const router = useRouter();
  const [venueType, setVenueType] = useState<"physical" | "virtual">("physical");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    const eventName = String(form.get("event_name") ?? "").trim();
    const date = String(form.get("date") ?? "").trim();
    const capacityRaw = String(form.get("capacity") ?? "").trim();
    const capacity = Number(capacityRaw);

    const location =
      venueType === "physical"
        ? [String(form.get("venue_name") ?? "").trim(), String(form.get("address") ?? "").trim()]
            .filter(Boolean)
            .join(", ")
        : String(form.get("meeting_link") ?? "").trim();

    if (!eventName || !date || !location || !capacityRaw || Number.isNaN(capacity) || capacity <= 0) {
      setError("Event name, date, location, and a valid capacity are required.");
      return;
    }

    setLoading(true);
    try {
      const imageUrl = imageFile ? await uploadEventImage(imageFile) : undefined;
      const created = await createEvent({
        event_name: eventName,
        description: String(form.get("description") ?? ""),
        date,
        location,
        capacity,
        image_url: imageUrl,
      });
      router.push(`/events/${created.event_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event.");
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar searchPlaceholder="Search events..." />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        <header className="bg-surface-container-lowest px-10 py-8 border-b border-outline-variant">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-1">
              <span>Events</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-primary font-semibold">Configuration Studio</span>
            </div>
            <h1 className="text-2xl font-semibold text-primary">Create New Event</h1>
            <p className="text-on-surface-variant max-w-2xl text-sm mt-1">
              Define the foundation of your experience. Configure identity, location, and capacity.
            </p>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-10 py-8 space-y-8">
          {error && (
            <p className="text-sm text-error bg-error-container/40 border border-error/20 rounded px-4 py-3">
              {error}
            </p>
          )}

          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fingerprint</span>
                <h3 className="text-base font-semibold text-primary">Core Identity</h3>
              </div>
              <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded text-xs">
                Section 01
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full">
                <label className="block text-xs text-on-surface-variant mb-1">Event Name</label>
                <input
                  required
                  name="event_name"
                  className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-tertiary-container focus:border-tertiary outline-none text-sm"
                  placeholder="e.g. Future Tech Summit 2026"
                  type="text"
                />
              </div>
              <div className="col-span-full">
                <label className="block text-xs text-on-surface-variant mb-1">Description</label>
                <textarea
                  name="description"
                  className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-tertiary-container focus:border-tertiary outline-none text-sm"
                  placeholder="Detail the purpose and highlights of your event..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Date</label>
                <input
                  required
                  name="date"
                  className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-tertiary-container focus:border-tertiary outline-none text-sm"
                  placeholder="e.g. Sep 14, 2026"
                  type="text"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Capacity</label>
                <input
                  required
                  name="capacity"
                  className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-tertiary-container focus:border-tertiary outline-none text-sm"
                  placeholder="e.g. 500"
                  type="number"
                  min={1}
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">image</span>
                <h3 className="text-base font-semibold text-primary">Event Image</h3>
              </div>
              <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded text-xs">
                Section 02
              </span>
            </div>
            <div className="p-6">
              <label
                htmlFor="event-image-input"
                className="block border-2 border-dashed border-outline-variant rounded-xl text-center bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer overflow-hidden"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Event preview" className="w-full max-h-64 object-cover" />
                ) : (
                  <div className="p-8">
                    <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                    </div>
                    <p className="text-sm text-primary font-semibold mb-1">Click to choose an image</p>
                    <p className="text-xs text-on-surface-variant">JPEG, PNG, or WebP</p>
                  </div>
                )}
              </label>
              <input
                id="event-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="mt-3 text-xs text-error hover:underline"
                >
                  Remove image
                </button>
              )}
            </div>
          </section>

          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="bg-surface-container-low px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <h3 className="text-base font-semibold text-primary">Venue & Access</h3>
              </div>
              <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded text-xs">
                Section 03
              </span>
            </div>
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setVenueType("physical")}
                  className={
                    venueType === "physical"
                      ? "flex-1 border-2 border-secondary bg-surface-container text-primary font-bold py-4 rounded-lg flex flex-col items-center gap-1"
                      : "flex-1 border border-outline-variant hover:bg-surface-container-low text-on-surface-variant py-4 rounded-lg flex flex-col items-center gap-1 transition-colors"
                  }
                >
                  <span className="material-symbols-outlined">corporate_fare</span>
                  <span className="text-xs">Physical Venue</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVenueType("virtual")}
                  className={
                    venueType === "virtual"
                      ? "flex-1 border-2 border-secondary bg-surface-container text-primary font-bold py-4 rounded-lg flex flex-col items-center gap-1"
                      : "flex-1 border border-outline-variant hover:bg-surface-container-low text-on-surface-variant py-4 rounded-lg flex flex-col items-center gap-1 transition-colors"
                  }
                >
                  <span className="material-symbols-outlined">videocam</span>
                  <span className="text-xs">Virtual / Hybrid</span>
                </button>
              </div>
              {venueType === "physical" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Venue Name</label>
                    <input
                      name="venue_name"
                      className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-tertiary-container focus:border-tertiary outline-none text-sm"
                      placeholder="The Grand Pavilion"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1">Full Address</label>
                    <input
                      name="address"
                      className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-tertiary-container focus:border-tertiary outline-none text-sm"
                      placeholder="123 Innovation Drive, Seattle, WA"
                      type="text"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-on-surface-variant mb-1">Meeting / Streaming Link</label>
                  <input
                    name="meeting_link"
                    className="w-full border border-outline px-4 py-2 rounded focus:ring-2 focus:ring-tertiary-container focus:border-tertiary outline-none text-sm"
                    placeholder="https://meet.eventcloud.io/your-event"
                    type="text"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="fixed bottom-0 left-0 right-0 ml-[240px] h-20 bg-surface-container-lowest border-t border-outline-variant z-50 px-10 flex items-center justify-end gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => router.push("/events")}
            className="px-6 py-2 rounded border border-outline-variant text-primary font-bold text-xs hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 rounded bg-secondary text-on-secondary font-bold text-xs shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100 transition-all"
          >
            {loading ? "Publishing..." : "Publish Event"}
          </button>
        </footer>
      </form>
    </>
  );
}
