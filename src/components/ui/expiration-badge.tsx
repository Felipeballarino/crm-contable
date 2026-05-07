import { daysUntil } from "@/lib/utils";

export function ExpirationBadge({ date }: { date: Date | string }) {
  const days = daysUntil(date);

  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Vencido ({Math.abs(days)}d)
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Hoy
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        {days}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
      {days}d
    </span>
  );
}
