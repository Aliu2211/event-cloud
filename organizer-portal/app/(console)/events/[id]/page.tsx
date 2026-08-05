"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Topbar } from "@/components/Topbar";
import { ScheduleTabs } from "@/components/ScheduleTabs";
import { AddSessionModal } from "@/components/AddSessionModal";
import {
  getEvent,
  listRegistrations,
  listSessions,
  listSpeakers,
  type EventRecord,
  type Registration,
  type Session,
  type Speaker,
} from "@/lib/api";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [error, setError] = useState("");
  const [showAddSession, setShowAddSession] = useState(false);

  useEffect(() => {
    let active = true;
    getEvent(eventId)
      .then((found) => {
        if (!active) return;
        if (!found) {
          setNotFoundState(true);
          return;
        }
        setEvent(found);
        return Promise.all([listRegistrations(eventId), listSessions(eventId), listSpeakers()]).then(
          ([registrationList, sessionList, speakerList]) => {
            if (!active) return;
            setRegistrations(registrationList);
            setSessions(sessionList);
            setSpeakers(speakerList);
          },
        );
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load event");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  if (notFoundState) notFound();
  if (loading && !event) {
    return (
      <>
        <Topbar searchPlaceholder="Search this event..." />
        <div className="flex-1 p-6 text-sm text-on-surface-variant">Loading event...</div>
      </>
    );
  }
  if (!event) return null;

  const percent = event.capacity > 0 ? Math.round((event.registered_count / event.capacity) * 100) : 0;
  const recentRegistrations = [...registrations]
    .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
    .slice(0, 6);

  return (
    <>
      <Topbar searchPlaceholder="Search this event..." />
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar max-w-[1400px] w-full mx-auto">
        {error && (
          <p className="text-sm text-error bg-error-container/40 border border-error/20 rounded px-4 py-3">
            {error}
          </p>
        )}

        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt=""
            className="w-full max-h-72 object-cover rounded-xl border border-outline-variant"
          />
        )}

        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1 text-on-surface-variant text-xs mb-1">
              <span>Events</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-semibold">{event.event_name}</span>
            </nav>
            <h2 className="text-2xl font-semibold text-primary tracking-tight">{event.event_name}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-secondary text-[18px]">calendar_today</span>
                {event.date}
              </span>
              <span className="flex items-center gap-1 text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-secondary text-[18px]">location_on</span>
                {event.location}
              </span>
              <span className="px-2 py-[2px] bg-secondary-fixed text-on-secondary-fixed text-xs rounded capitalize">
                {event.status}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Registrations</span>
              <span className="material-symbols-outlined text-secondary">person_add</span>
            </div>
            <h3 className="text-2xl font-bold text-primary mt-4">{event.registered_count.toLocaleString("en-US")}</h3>
            <p className="text-xs text-on-surface-variant">Capacity: {event.capacity.toLocaleString("en-US")}</p>
            <div className="mt-4 w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
              <div className="bg-secondary h-full" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[11px] text-on-surface-variant">
              <span>{percent}% Complete</span>
              <span>{Math.max(event.capacity - event.registered_count, 0)} left</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Sessions</span>
              <span className="material-symbols-outlined text-secondary">event_note</span>
            </div>
            <h3 className="text-2xl font-bold text-primary mt-4">{sessions.length}</h3>
            <p className="text-xs text-on-surface-variant">Scheduled across the event</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Status</span>
              <span className="material-symbols-outlined text-secondary">info</span>
            </div>
            <h3 className="text-2xl font-bold text-primary mt-4 capitalize">{event.status}</h3>
            <p className="text-xs text-on-surface-variant">
              Last updated {new Date(event.updated_at).toLocaleDateString("en-US")}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Live Schedule Management</h3>
              <button
                type="button"
                onClick={() => setShowAddSession(true)}
                className="text-on-tertiary-container bg-tertiary-fixed-dim hover:bg-tertiary-fixed px-4 py-2 rounded text-xs transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Add Session
              </button>
            </div>
            <ScheduleTabs sessions={sessions} speakers={speakers} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Recent Registrations</h3>
              <a href={`/attendees?event=${event.event_id}`} className="text-secondary text-xs font-bold hover:underline">
                View All
              </a>
            </div>
            {recentRegistrations.length > 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-4 space-y-2">
                {recentRegistrations.map((registration) => (
                  <div
                    key={registration.registration_id}
                    className="flex items-center gap-4 p-2 hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {registration.participant_name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h5 className="text-sm font-bold text-primary truncate">{registration.participant_name}</h5>
                      <p className="text-xs text-on-surface-variant truncate">{registration.email}</p>
                    </div>
                    <span className="text-on-surface-variant text-[10px] uppercase font-bold shrink-0">
                      {new Date(registration.registered_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center shadow-sm">
                <p className="text-sm text-on-surface-variant">No registrations yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {showAddSession && (
        <AddSessionModal
          eventId={event.event_id}
          speakers={speakers}
          onClose={() => setShowAddSession(false)}
          onCreated={(session) => {
            setSessions((prev) => [...prev, session]);
            setShowAddSession(false);
          }}
        />
      )}
    </>
  );
}
