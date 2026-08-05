import { getIdToken } from "./auth";

const API = process.env.NEXT_PUBLIC_API_URL!;

export type EventStatus = "available" | "limited" | "full" | "cancelled";

export interface EventRecord {
  event_id: string;
  event_name: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  registered_count: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

export interface Registration {
  event_id: string;
  registration_id: string;
  participant_name: string;
  email: string;
  phone?: string;
  registered_at: string;
  ticket_number: string;
  status: "confirmed" | "cancelled";
}

export interface Speaker {
  speaker_id: string;
  name: string;
  role: string;
  bio: string;
  expertise: string[];
  years_experience: number;
  talks_delivered: number;
}

export interface Session {
  event_id: string;
  session_id: string;
  day: string;
  time: string;
  track: string;
  title: string;
  description: string;
  location: string;
  speaker_id?: string;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  if (!token) throw new Error("You must be signed in to do this.");
  return { Authorization: token };
}

export async function listEvents(status?: string): Promise<EventRecord[]> {
  const url = status ? `${API}/events?status=${status}` : `${API}/events`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load events");
  return (await res.json()).events;
}

export async function getEvent(eventId: string): Promise<EventRecord | null> {
  const res = await fetch(`${API}/events/${eventId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load event");
  return res.json();
}

export interface CreateEventPayload {
  event_name: string;
  description?: string;
  date: string;
  location: string;
  capacity: number;
  image_url?: string;
}

export async function createEvent(payload: CreateEventPayload): Promise<EventRecord> {
  const res = await fetch(`${API}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

const UPLOADABLE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadEventImage(file: File): Promise<string> {
  if (!UPLOADABLE_IMAGE_TYPES.has(file.type)) {
    throw new Error("Image must be a JPEG, PNG, or WebP file.");
  }
  const res = await fetch(`${API}/uploads/image-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ content_type: file.type }),
  });
  if (!res.ok) throw new Error("Failed to prepare image upload.");
  const { upload_url, image_url } = await res.json();

  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Failed to upload image.");

  return image_url;
}

export async function listRegistrations(eventId: string): Promise<Registration[]> {
  const res = await fetch(`${API}/events/${eventId}/registrations`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load registrations");
  return (await res.json()).registrations;
}

export async function listAllRegistrations(): Promise<Registration[]> {
  const res = await fetch(`${API}/registrations`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load registrations");
  return (await res.json()).registrations;
}

export async function listSessions(eventId: string): Promise<Session[]> {
  const res = await fetch(`${API}/events/${eventId}/sessions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load sessions");
  return (await res.json()).sessions;
}

export interface CreateSessionPayload {
  day: string;
  time: string;
  title: string;
  location: string;
  description?: string;
  track?: string;
  speaker_id?: string;
}

export async function createSession(eventId: string, payload: CreateSessionPayload): Promise<Session> {
  const res = await fetch(`${API}/events/${eventId}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function listSpeakers(): Promise<Speaker[]> {
  const res = await fetch(`${API}/speakers`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load speakers");
  return (await res.json()).speakers;
}

export interface CreateRegistrationPayload {
  participant_name: string;
  email: string;
  phone?: string;
}

export async function createRegistration(eventId: string, payload: CreateRegistrationPayload): Promise<Registration> {
  const res = await fetch(`${API}/events/${eventId}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new Error("This person is already registered for that event.");
  if (res.status === 400) throw new Error("This event is not available for registration.");
  if (!res.ok) throw new Error("Failed to register attendee.");
  return res.json();
}

export async function cancelRegistration(registrationId: string): Promise<void> {
  const res = await fetch(`${API}/registrations/${registrationId}`, { method: "DELETE" });
  if (res.status === 404) throw new Error("Registration not found.");
  if (res.status === 400) throw new Error("Registration is already cancelled.");
  if (!res.ok) throw new Error("Failed to cancel registration.");
}
