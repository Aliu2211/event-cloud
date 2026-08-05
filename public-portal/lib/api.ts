import {
  events as mockEvents,
  getEvent as getMockEvent,
  getRegistration as getMockRegistration,
  getRegistrationsByEmail as getMockRegistrationsByEmail,
  getSessionsByEvent as getMockSessionsByEvent,
  getSessionsBySpeaker as getMockSessionsBySpeaker,
  getSpeaker as getMockSpeaker,
  registrations as mockRegistrations,
  speakers as mockSpeakers,
  type EventRecord,
  type Registration,
  type Session,
  type Speaker,
} from "./mock-data";

const API = process.env.NEXT_PUBLIC_API_URL;

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listEvents(status?: string): Promise<EventRecord[]> {
  if (!API) {
    await delay();
    return status ? mockEvents.filter((event) => event.status === status) : mockEvents;
  }
  const url = status ? `${API}/events?status=${status}` : `${API}/events`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load events");
  return (await res.json()).events;
}

export async function getEvent(eventId: string): Promise<EventRecord | null> {
  if (!API) {
    await delay();
    return getMockEvent(eventId) ?? null;
  }
  const res = await fetch(`${API}/events/${eventId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load event");
  return res.json();
}

export interface RegisterPayload {
  participant_name: string;
  email: string;
  phone?: string;
}

// In mock mode, registrations are generated in-memory and are not persisted
// across a server-rendered navigation (e.g. visiting /ticket/[id] fresh).
// Once NEXT_PUBLIC_API_URL points at the deployed API, this all becomes real.
export async function registerForEvent(eventId: string, payload: RegisterPayload): Promise<Registration> {
  if (!API) {
    await delay(400);
    const event = getMockEvent(eventId);
    if (!event) throw new Error("Event not found.");
    if (event.status === "full" || event.status === "cancelled") {
      throw new Error("This event is not available for registration.");
    }
    const alreadyRegistered = mockRegistrations.some(
      (registration) =>
        registration.event_id === eventId && registration.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (alreadyRegistered) {
      throw new Error("You are already registered for this event.");
    }
    const suffix = Math.random().toString(16).slice(2, 8).toUpperCase();
    const registration: Registration = {
      event_id: eventId,
      registration_id: `REG-${suffix}${suffix.slice(0, 2)}`,
      participant_name: payload.participant_name,
      email: payload.email,
      phone: payload.phone,
      registered_at: new Date().toISOString(),
      ticket_number: `TKT-${eventId.slice(4, 10)}-${suffix}`,
      status: "confirmed",
    };
    mockRegistrations.push(registration);
    event.registered_count += 1;
    const fillRatio = event.registered_count / event.capacity;
    if (fillRatio >= 1) event.status = "full";
    else if (fillRatio >= 0.8) event.status = "limited";
    return registration;
  }

  const res = await fetch(`${API}/events/${eventId}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new Error("You are already registered for this event.");
  if (res.status === 400) throw new Error("This event is not available for registration.");
  if (!res.ok) throw new Error("Registration failed. Please try again.");
  return res.json();
}

export async function getRegistration(registrationId: string): Promise<Registration | null> {
  if (!API) {
    await delay();
    return getMockRegistration(registrationId) ?? null;
  }
  const res = await fetch(`${API}/registrations/${registrationId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load registration");
  return res.json();
}

export async function getRegistrationsByEmail(email: string): Promise<Registration[]> {
  if (!API) {
    await delay();
    return getMockRegistrationsByEmail(email);
  }
  const res = await fetch(`${API}/registrations/lookup?email=${encodeURIComponent(email)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to look up tickets");
  return (await res.json()).registrations;
}

export async function listSessions(eventId: string): Promise<Session[]> {
  if (!API) {
    await delay();
    return getMockSessionsByEvent(eventId);
  }
  const res = await fetch(`${API}/events/${eventId}/sessions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load sessions");
  return (await res.json()).sessions;
}

export async function listSpeakers(): Promise<Speaker[]> {
  if (!API) {
    await delay();
    return mockSpeakers;
  }
  const res = await fetch(`${API}/speakers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load speakers");
  return (await res.json()).speakers;
}

export async function getSpeaker(speakerId: string): Promise<Speaker | null> {
  if (!API) {
    await delay();
    return getMockSpeaker(speakerId) ?? null;
  }
  const res = await fetch(`${API}/speakers/${speakerId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load speaker");
  return res.json();
}

export async function listSessionsBySpeaker(speakerId: string): Promise<Session[]> {
  if (!API) {
    await delay();
    return getMockSessionsBySpeaker(speakerId);
  }
  const res = await fetch(`${API}/speakers/${speakerId}/sessions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load speaker sessions");
  return (await res.json()).sessions;
}
