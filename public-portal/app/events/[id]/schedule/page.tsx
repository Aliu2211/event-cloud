import { notFound } from "next/navigation";
import Link from "next/link";
import { ScheduleView } from "@/components/ScheduleView";
import { getEvent, listSessions, listSpeakers } from "@/lib/api";

// Sessions can be added by an organizer at any time; never serve a cached render.
export const dynamic = "force-dynamic";

export default async function EventSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, sessions, speakers] = await Promise.all([getEvent(id), listSessions(id), listSpeakers()]);
  if (!event) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 w-full">
      <nav className="text-xs text-on-surface-variant mb-4">
        <Link href={`/events/${event.event_id}`} className="hover:text-primary">
          {event.event_name}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-primary font-medium">Schedule</span>
      </nav>

      <h1 className="text-2xl font-bold text-primary mb-1">Session Agenda</h1>
      <p className="text-sm text-on-surface-variant mb-8">Explore the full schedule for {event.event_name}.</p>

      <ScheduleView sessions={sessions} speakers={speakers} />
    </div>
  );
}
