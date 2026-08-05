"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Session, Speaker } from "@/lib/mock-data";
import { initials } from "@/lib/mock-data";

export function ScheduleView({ sessions, speakers }: { sessions: Session[]; speakers: Speaker[] }) {
  const speakerById = useMemo(() => new Map(speakers.map((speaker) => [speaker.speaker_id, speaker])), [speakers]);
  const days = useMemo(() => Array.from(new Set(sessions.map((session) => session.day))), [sessions]);
  const tracks = useMemo(
    () => Array.from(new Set(sessions.map((session) => session.track).filter(Boolean))),
    [sessions],
  );

  const [activeDay, setActiveDay] = useState(days[0]);
  const [activeTracks, setActiveTracks] = useState<Set<string>>(new Set(tracks));

  function toggleTrack(track: string) {
    setActiveTracks((prev) => {
      const next = new Set(prev);
      if (next.has(track)) next.delete(track);
      else next.add(track);
      return next;
    });
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">event_busy</span>
        <p className="text-sm text-on-surface-variant mt-2">No sessions have been scheduled for this event yet.</p>
      </div>
    );
  }

  const visibleSessions = sessions.filter(
    (session) => session.day === activeDay && (session.track ? activeTracks.has(session.track) : true),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {tracks.length > 0 && (
        <aside className="md:col-span-1">
          <h3 className="text-sm font-semibold text-primary mb-3">Tracks</h3>
          <div className="space-y-2">
            {tracks.map((track) => (
              <label key={track} className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeTracks.has(track)}
                  onChange={() => toggleTrack(track)}
                  className="rounded border-outline text-secondary focus:ring-secondary/30"
                />
                {track}
              </label>
            ))}
          </div>
        </aside>
      )}

      <div className={tracks.length > 0 ? "md:col-span-3" : "md:col-span-4"}>
        {days.length > 1 && (
          <div className="flex gap-2 mb-6 border-b border-outline-variant">
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={
                  day === activeDay
                    ? "px-3 py-2 text-sm font-semibold text-primary border-b-2 border-secondary"
                    : "px-3 py-2 text-sm text-on-surface-variant hover:text-primary"
                }
              >
                {day}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {visibleSessions.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No sessions match the selected tracks.</p>
          ) : (
            visibleSessions.map((session) => {
              const speaker = session.speaker_id ? speakerById.get(session.speaker_id) : undefined;
              return (
                <div
                  key={session.session_id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col md:flex-row gap-4"
                >
                  <div className="md:w-28 shrink-0">
                    <p className="text-sm font-bold text-primary">{session.time}</p>
                    <p className="text-xs text-on-surface-variant">{session.location}</p>
                  </div>
                  <div className="flex-1">
                    {session.track && (
                      <span className="inline-block bg-surface-container-highest text-on-surface-variant text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-1">
                        {session.track}
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-primary">{session.title}</h3>
                    {session.description && (
                      <p className="text-sm text-on-surface-variant mt-1">{session.description}</p>
                    )}
                    {speaker && (
                      <Link href={`/speakers/${speaker.speaker_id}`} className="flex items-center gap-2 mt-3 group w-fit">
                        <div className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-[11px] font-bold">
                          {initials(speaker.name)}
                        </div>
                        <span className="text-sm text-primary font-medium group-hover:underline">
                          {speaker.name}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
