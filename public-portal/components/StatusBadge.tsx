import type { EventStatus } from "@/lib/mock-data";

const STYLES: Record<EventStatus, string> = {
  available: "bg-green-100 text-green-700",
  limited: "bg-secondary-container/20 text-secondary",
  full: "bg-error-container text-on-error-container",
  cancelled: "bg-surface-container-highest text-on-surface-variant",
};

const LABELS: Record<EventStatus, string> = {
  available: "Available",
  limited: "Limited",
  full: "Full",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-[2px] rounded-full text-[11px] font-bold uppercase ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
