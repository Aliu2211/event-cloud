import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import type { EventRecord } from "@/lib/mock-data";

export function EventCard({ event }: { event: EventRecord }) {
  const selectable = event.status === "available" || event.status === "limited";
  const percent = Math.min(Math.round((event.registered_count / event.capacity) * 100), 100);

  const content = (
    <div
      className={
        selectable
          ? "bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:border-secondary hover:shadow-md transition-all h-full flex flex-col"
          : "bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden h-full flex flex-col opacity-50 cursor-not-allowed"
      }
    >
      {event.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={event.image_url} alt="" className="w-full h-40 object-cover" />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-primary leading-snug">{event.event_name}</h3>
          <StatusBadge status={event.status} />
        </div>
        <p className="text-sm text-on-surface-variant flex items-center gap-1 mb-1">
          <span className="material-symbols-outlined text-[16px]">calendar_today</span>
          {event.date_range}
        </p>
        <p className="text-sm text-on-surface-variant flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          {event.location}
        </p>
        <p className="text-sm text-on-surface-variant mb-4 flex-1">{event.description}</p>
        <div>
          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-secondary-container" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            {event.registered_count} / {event.capacity} registered
          </p>
        </div>
      </div>
    </div>
  );

  if (!selectable) {
    return <div aria-disabled="true">{content}</div>;
  }

  return (
    <Link href={`/events/${event.event_id}`} className="block h-full">
      {content}
    </Link>
  );
}
