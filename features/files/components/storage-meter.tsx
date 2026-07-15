import { AlertTriangle } from "lucide-react";
import { formatBytes } from "@/features/files/lib/format";

export const STORAGE_LIMIT_BYTES = 10 * 1024 ** 3;

const RADIUS = 15.9155;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CRITICAL_THRESHOLD_PERCENT = 90;

export function StorageMeter({
  usedBytes,
  limitBytes,
}: {
  usedBytes: number;
  limitBytes: number;
}) {
  const percent = Math.min(100, (usedBytes / limitBytes) * 100);
  const isCritical = percent >= CRITICAL_THRESHOLD_PERCENT;
  const dash = (percent / 100) * CIRCUMFERENCE;

  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5">
      <svg viewBox="0 0 36 36" className="size-8 shrink-0 -rotate-90">
        <circle cx="18" cy="18" r={RADIUS} fill="none" strokeWidth="3" className="stroke-muted" />
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
          className={isCritical ? "stroke-destructive" : "stroke-primary"}
        />
      </svg>
      <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
        <span className="flex items-center gap-1 truncate text-xs font-medium">
          {isCritical && <AlertTriangle className="size-3 text-destructive" />}
          {formatBytes(usedBytes)} used
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          of {formatBytes(limitBytes)}
        </span>
      </div>
    </div>
  );
}
