"use client";

import { useMemo, useState } from "react";
import type { Session, Speaker } from "@/lib/api";

export function ScheduleTabs({ sessions, speakers }: { sessions: Session[]; speakers: Speaker[] }) {
  const speakersById = useMemo(() => new Map(speakers.map((speaker) => [speaker.speaker_id, speaker])), [speakers]);

  const days = useMemo(() => {
    const seen: string[] = [];
    for (const session of sessions) {
      if (!seen.includes(session.day)) seen.push(session.day);
    }
    return seen;
  }, [sessions]);

  const [activeDay, setActiveDay] = useState(0);
  const day = days[activeDay];
  const daySessions = sessions
    .filter((session) => session.day === day)
    .sort((a, b) => a.time.localeCompare(b.time));

  if (days.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center shadow-sm">
        <p className="text-sm text-on-surface-variant">No sessions added yet. Add Session to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-surface-container-low border-b border-outline-variant flex items-center gap-6 overflow-x-auto">
        {days.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => setActiveDay(i)}
            className={
              i === activeDay
                ? "text-primary border-b-2 border-secondary pb-1 text-sm font-medium whitespace-nowrap"
                : "text-on-surface-variant pb-1 text-sm whitespace-nowrap hover:text-primary transition-colors"
            }
          >
            {d}
          </button>
        ))}
      </div>
      <div className="divide-y divide-outline-variant">
        {daySessions.map((session) => {
          const speaker = session.speaker_id ? speakersById.get(session.speaker_id) : undefined;
          return (
            <div key={session.session_id} className="p-6 flex items-start gap-6 hover:bg-surface transition-colors">
              <div className="text-center min-w-[70px]">
                <p className="text-lg font-bold text-primary">{session.time}</p>
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-primary">{session.title}</h4>
                {session.description && (
                  <p className="text-sm text-on-surface-variant mt-1">{session.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {session.location}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    {speaker ? speaker.name : "No speaker assigned"}
                  </span>
                  {session.track && (
                    <span className="px-2 py-[2px] bg-secondary-fixed text-on-secondary-fixed text-[11px] rounded">
                      {session.track}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
