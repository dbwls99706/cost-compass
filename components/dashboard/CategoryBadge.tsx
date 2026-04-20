import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type CostCategory } from "@/lib/types/db";
import { cn } from "@/lib/utils";

const CATEGORY_CLASS: Record<CostCategory, string> = {
  LABOR: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-indigo-200",
  OUTSOURCE: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
  OPERATING: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
  COMMON: "bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200",
};

export const CATEGORY_FILL: Record<CostCategory, string> = {
  LABOR: "#6366f1",
  OUTSOURCE: "#10b981",
  OPERATING: "#f59e0b",
  COMMON: "#64748b",
};

export const CategoryBadge = ({ category }: { category: CostCategory }) => (
  <Badge variant="outline" className={cn("font-medium", CATEGORY_CLASS[category])}>
    {CATEGORY_LABELS[category]}
  </Badge>
);
