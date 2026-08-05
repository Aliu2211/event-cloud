import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { listEvents } from "@/lib/api";

// Registration counts and status change from other requests constantly;
// this page must never be served from a cached render.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await listEvents();

  return (
    <>
      <section className="bg-gradient-to-b from-surface-container-low to-surface px-4 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-secondary-container/20 text-secondary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            Cloud Innovation Events
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-primary tracking-tight mb-4">
            Discover events built for cloud builders
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg mb-8">
            Browse upcoming conferences, workshops, and meetups, and register your spot in seconds. No account
            required.
          </p>
          <Link
            href="#events"
            className="inline-block bg-secondary text-on-secondary px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Browse Events
          </Link>
        </div>
      </section>

      <section id="events" className="max-w-6xl mx-auto px-4 py-16 w-full scroll-mt-16">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-primary mb-1">Upcoming Events</h2>
          <p className="text-sm text-on-surface-variant">
            {events.length} event{events.length === 1 ? "" : "s"} currently listed.
          </p>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No events are currently available. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
