import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { EventRegistration } from "@/components/EventRegistration";
import { type EventStatus } from "@/lib/mock-data";
import { getEvent } from "@/lib/api";

// Event status, capacity, and registration counts change from other
// requests constantly; this page must never be served from a cached render.
export const dynamic = "force-dynamic";

const HERO_ICON: Record<EventStatus, string> = {
  available: "rocket_launch",
  limited: "local_fire_department",
  full: "groups",
  cancelled: "event_busy",
};

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const spotsLeft = Math.max(event.capacity - event.registered_count, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 w-full">
      <nav className="text-xs text-on-surface-variant mb-4">
        <Link href="/" className="hover:text-primary">
          Explore
        </Link>
        <span className="mx-1">/</span>
        <span className="text-primary font-medium">{event.event_name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary-container relative aspect-video flex items-end p-6">
            {event.image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </>
            ) : (
              <span className="material-symbols-outlined absolute top-4 right-4 text-white/20 text-[120px] pointer-events-none">
                {HERO_ICON[event.status]}
              </span>
            )}
            <div className="relative z-10">
              <StatusBadge status={event.status} />
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">{event.event_name}</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
              {event.date_range}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[18px]">location_on</span>
              {event.location}
            </span>
          </div>

          <p className="text-on-surface-variant">{event.description}</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-primary">{event.capacity}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-wide">Capacity</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-primary">{event.registered_count}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-wide">Registered</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-primary">{spotsLeft}</p>
              <p className="text-xs text-on-surface-variant uppercase tracking-wide">Spots Left</p>
            </div>
          </div>

          <Link
            href={`/events/${event.event_id}/schedule`}
            className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
          >
            View full schedule
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div>
          <EventRegistration event={event} />
        </div>
      </div>
    </div>
  );
}
