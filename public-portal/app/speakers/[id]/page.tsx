import { notFound } from "next/navigation";
import Link from "next/link";
import { initials } from "@/lib/mock-data";
import { getEvent, getSpeaker, listSessionsBySpeaker } from "@/lib/api";

// A speaker's session list can change as organizers add sessions elsewhere;
// this page must never be served from a cached render.
export const dynamic = "force-dynamic";

export default async function SpeakerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: speakerId } = await params;
  const speaker = await getSpeaker(speakerId);
  if (!speaker) notFound();

  const sessions = await listSessionsBySpeaker(speakerId);
  const eventIds = Array.from(new Set(sessions.map((session) => session.event_id)));
  const events = await Promise.all(eventIds.map((eventId) => getEvent(eventId)));
  const eventNameById = new Map(events.filter(Boolean).map((event) => [event!.event_id, event!.event_name]));

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 w-full">
      <Link href="/" className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1 mb-6">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Explore
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="aspect-square rounded-xl bg-primary flex items-center justify-center">
            <span className="text-4xl font-bold text-white">{initials(speaker.name)}</span>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <h3 className="text-sm font-semibold text-primary mb-3">Key Expertise</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {speaker.expertise.map((skill) => (
                <span
                  key={skill}
                  className="bg-surface-container-highest text-on-surface-variant text-xs px-2 py-1 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="border-t border-outline-variant pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Industry Exp.</span>
                <span className="font-semibold text-primary">{speaker.years_experience}+ Years</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Talks Delivered</span>
                <span className="font-semibold text-primary">{speaker.talks_delivered}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">{speaker.name}</h1>
            <p className="text-secondary font-medium">{speaker.role}</p>
          </div>

          {speaker.bio && <p className="text-on-surface-variant">{speaker.bio}</p>}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-primary">Scheduled Sessions</h2>
              <span className="bg-secondary-container/20 text-secondary text-xs font-bold px-3 py-1 rounded-full">
                {sessions.length} Session{sessions.length === 1 ? "" : "s"}
              </span>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No sessions scheduled yet.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <Link
                    key={session.session_id}
                    href={`/events/${session.event_id}/schedule`}
                    className="block bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-secondary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      {session.track && (
                        <span className="text-[10px] font-bold uppercase text-secondary">{session.track}</span>
                      )}
                      <span className="text-xs text-on-surface-variant">
                        {session.day} · {session.time}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-primary">{session.title}</h3>
                    {session.description && (
                      <p className="text-sm text-on-surface-variant mt-1">{session.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        {eventNameById.get(session.event_id) ?? "Unknown event"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
