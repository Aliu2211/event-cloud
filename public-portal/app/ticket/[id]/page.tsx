import Link from "next/link";
import { TicketView } from "@/components/TicketView";
import { getEvent, getRegistration } from "@/lib/api";

// A ticket looked up right after registration must never come from a
// cached render of a previous (or nonexistent) registration ID.
export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registration = await getRegistration(id);
  const event = registration ? await getEvent(registration.event_id) : null;

  if (!registration || !event) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
        <h1 className="text-xl font-semibold text-primary mt-4">Ticket not found</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          We couldn&apos;t find a registration with ID <span className="font-mono">{id}</span>. Double-check the
          link from your confirmation email.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 bg-secondary text-on-secondary px-5 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 w-full">
      <h1 className="text-xl font-semibold text-primary mb-6 text-center">Your Ticket</h1>
      <TicketView registration={registration} event={event} />
    </div>
  );
}
