import { cn } from "@/lib/utils";

const CONFIG = {
  connected: {
    label: "Connected",
    dot: "bg-emerald-500",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  stale: {
    label: "Stale",
    dot: "bg-amber-500",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  dormant: {
    label: "Dormant",
    dot: "bg-red-500",
    cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
  never: {
    label: "Never Connected",
    dot: "bg-muted-foreground/40",
    cls: "bg-muted text-muted-foreground",
  },
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-muted-foreground/40",
    cls: "bg-muted text-muted-foreground",
  },
};

export function HealthBadge({ health }) {
  const cfg = CONFIG[health] || CONFIG.never;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        cfg.cls
      )}
    >
      <span className={cn("size-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}