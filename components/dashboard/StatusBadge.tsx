import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type ProjectStatus } from "@/lib/types/db";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<ProjectStatus, string> = {
  PLANNING: "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200",
  ACTIVE: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  CLOSED: "bg-zinc-100 text-zinc-600 hover:bg-zinc-100 border-zinc-200",
};

export const StatusBadge = ({ status }: { status: ProjectStatus }) => (
  <Badge variant="outline" className={cn("font-medium", STATUS_CLASS[status])}>
    {STATUS_LABELS[status]}
  </Badge>
);
