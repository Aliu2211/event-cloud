export type EventStatus = "available" | "limited" | "full" | "cancelled";

export interface EventRecord {
  event_id: string;
  event_name: string;
  description: string;
  date: string;
  date_range: string;
  location: string;
  capacity: number;
  registered_count: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

export const events: EventRecord[] = [
  {
    event_id: "EVT-3F9A21B0C4",
    event_name: "Global Cloud Summit 2026",
    description:
      "Three days of keynotes, hands-on workshops, and networking for architects and engineers building on serverless infrastructure.",
    date: "Sep 14, 2026",
    date_range: "Sep 14-16, 2026",
    location: "Venetian Expo, Las Vegas, NV",
    capacity: 800,
    registered_count: 512,
    status: "available",
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-08-01T12:00:00Z",
  },
  {
    event_id: "EVT-A1C8D3E7F2",
    event_name: "Serverless Architecture Workshop",
    description: "A hands-on deep dive into event-driven design, Lambda cold-start tuning, and multi-region failover.",
    date: "Sep 10, 2026",
    date_range: "Sep 10, 2026",
    location: "Virtual Event",
    capacity: 200,
    registered_count: 172,
    status: "limited",
    created_at: "2026-06-10T09:00:00Z",
    updated_at: "2026-07-28T12:00:00Z",
  },
  {
    event_id: "EVT-88B4C0912D",
    event_name: "Women in Cloud Networking Mixer",
    description: "An evening of community, mentorship, and conversation for women building in cloud infrastructure.",
    date: "Aug 22, 2026",
    date_range: "Aug 22, 2026",
    location: "Austin, TX",
    capacity: 120,
    registered_count: 120,
    status: "full",
    created_at: "2026-05-15T09:00:00Z",
    updated_at: "2026-07-20T12:00:00Z",
  },
  {
    event_id: "EVT-56E2F9A103",
    event_name: "Kubernetes Fundamentals Bootcamp",
    description: "Get hands-on with clusters, deployments, and service meshes in this two-day intensive bootcamp.",
    date: "Oct 05, 2026",
    date_range: "Oct 05-06, 2026",
    location: "Chicago, IL",
    capacity: 150,
    registered_count: 38,
    status: "available",
    created_at: "2026-06-20T09:00:00Z",
    updated_at: "2026-07-15T12:00:00Z",
  },
  {
    event_id: "EVT-D40B7C2E89",
    event_name: "Legacy Systems Migration Forum",
    description: "Strategies and case studies for migrating monolithic workloads to cloud-native architectures.",
    date: "Aug 30, 2026",
    date_range: "Aug 30, 2026",
    location: "Washington, D.C.",
    capacity: 300,
    registered_count: 0,
    status: "cancelled",
    created_at: "2026-05-01T09:00:00Z",
    updated_at: "2026-07-05T12:00:00Z",
  },
];

export function getEvent(id: string): EventRecord | undefined {
  return events.find((event) => event.event_id === id);
}

export type RegistrationStatus = "confirmed" | "cancelled";

export interface Registration {
  event_id: string;
  registration_id: string;
  participant_name: string;
  email: string;
  phone?: string;
  registered_at: string;
  ticket_number: string;
  status: RegistrationStatus;
}

export const registrations: Registration[] = [
  {
    event_id: "EVT-3F9A21B0C4",
    registration_id: "REG-4B7A2C9E10",
    participant_name: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1 512 555 0148",
    registered_at: "2026-07-02T14:32:00Z",
    ticket_number: "TKT-3F9A21-B08C4E",
    status: "confirmed",
  },
  {
    event_id: "EVT-A1C8D3E7F2",
    registration_id: "REG-9D2E5F1A33",
    participant_name: "Alex Rivera",
    email: "alex.rivera@example.com",
    phone: "+1 512 555 0148",
    registered_at: "2026-07-10T09:15:00Z",
    ticket_number: "TKT-A1C8D3-77A210",
    status: "confirmed",
  },
];

export function getRegistration(id: string): Registration | undefined {
  return registrations.find((registration) => registration.registration_id === id);
}

export function getRegistrationsByEmail(email: string): Registration[] {
  const normalized = email.trim().toLowerCase();
  return registrations.filter((registration) => registration.email.toLowerCase() === normalized);
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

export const speakers: Speaker[] = [
  {
    speaker_id: "SPK-MOCKSARAH1",
    name: "Sarah Chen",
    role: "CTO at CloudDynamics",
    bio: "Sarah Chen is a visionary technology leader specializing in hyper-scale cloud architectures and serverless transformation. As CTO of CloudDynamics, she leads global engineering teams building resilient, enterprise-grade infrastructure. With a career spanning two decades, Sarah has been at the forefront of the DevOps movement and was an early advocate for microservices.",
    expertise: ["Cloud Infrastructure", "Serverless", "Architecture", "CI/CD", "Scalability"],
    years_experience: 15,
    talks_delivered: 42,
  },
  {
    speaker_id: "SPK-MOCKMARCUS1",
    name: "Marcus Thorne",
    role: "Lead Architect at ScaleFlow",
    bio: "Marcus Thorne designs multi-region, fault-tolerant systems for high-growth SaaS companies. He specializes in event-driven architecture and cost-optimized infrastructure at scale.",
    expertise: ["Multi-Region Resiliency", "Event-Driven Systems", "Cost Optimization"],
    years_experience: 12,
    talks_delivered: 27,
  },
  {
    speaker_id: "SPK-MOCKELENA1",
    name: "Elena Rodriguez",
    role: "Principal Cloud Architect",
    bio: "Elena Rodriguez helps enterprise teams migrate legacy workloads to serverless platforms without disrupting production traffic. She writes and speaks widely on pragmatic cloud migration strategy.",
    expertise: ["Migration Strategy", "Zero Trust", "Platform Engineering"],
    years_experience: 10,
    talks_delivered: 19,
  },
];

export function getSpeaker(speakerId: string): Speaker | undefined {
  return speakers.find((speaker) => speaker.speaker_id === speakerId);
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

const MOCK_FLAGSHIP_EVENT_ID = "EVT-3F9A21B0C4";

export const schedule: Session[] = [
  {
    event_id: MOCK_FLAGSHIP_EVENT_ID,
    session_id: "SES-MOCK1",
    day: "Day 1: Sep 14",
    time: "09:00 AM",
    track: "Technical",
    title: "Architecture at Scale: Global Cloud Distribution",
    description: "Patterns and anti-patterns for managing multi-region latency and consistency guarantees.",
    location: "Main Hall A",
    speaker_id: "SPK-MOCKSARAH1",
  },
  {
    event_id: MOCK_FLAGSHIP_EVENT_ID,
    session_id: "SES-MOCK2",
    day: "Day 1: Sep 14",
    time: "11:00 AM",
    track: "Technical",
    title: "Architecting Multi-Region Resiliency",
    description: "A deep dive into fault tolerance, circuit breaking, and event-driven orchestration at scale.",
    location: "Workshop Room 4",
    speaker_id: "SPK-MOCKMARCUS1",
  },
  {
    event_id: MOCK_FLAGSHIP_EVENT_ID,
    session_id: "SES-MOCK3",
    day: "Day 1: Sep 14",
    time: "02:00 PM",
    track: "Security",
    title: "Zero Trust Implementation",
    description: "A practical roadmap for rolling out zero trust across a distributed serverless estate.",
    location: "Room 204",
    speaker_id: "SPK-MOCKELENA1",
  },
  {
    event_id: MOCK_FLAGSHIP_EVENT_ID,
    session_id: "SES-MOCK4",
    day: "Day 2: Sep 15",
    time: "09:30 AM",
    track: "Management",
    title: "The ROI of Serverless: Beyond the Hype",
    description: "A data-driven comparison of traditional infrastructure costs versus managed serverless platforms.",
    location: "Main Hall A",
    speaker_id: "SPK-MOCKMARCUS1",
  },
  {
    event_id: MOCK_FLAGSHIP_EVENT_ID,
    session_id: "SES-MOCK5",
    day: "Day 2: Sep 15",
    time: "01:00 PM",
    track: "Community",
    title: "Migrating Legacy Core Systems",
    description: "Lessons learned from a two-year migration of a Fortune 500 core banking platform.",
    location: "North Exhibition Hall",
    speaker_id: "SPK-MOCKELENA1",
  },
];

export function getSessionsByEvent(eventId: string): Session[] {
  return schedule.filter((session) => session.event_id === eventId);
}

export function getSessionsBySpeaker(speakerId: string): Session[] {
  return schedule.filter((session) => session.speaker_id === speakerId);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
