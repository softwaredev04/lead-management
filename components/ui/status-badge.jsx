import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VARIANTS = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  Contacted: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  "Closed Won": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "Closed Lost": "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  Spam: "bg-gray-200 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
};

export function StatusBadge({ status }) {
  const cls = VARIANTS[status] || "bg-muted text-muted-foreground";
  return (
    <Badge variant="outline" className={cn("border-transparent", cls)}>
      {status}
    </Badge>
  );
}
