import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "default" | "positive" | "negative" | "indigo";
};

const ACCENT_CLASS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  default: "text-foreground",
  positive: "text-emerald-600",
  negative: "text-red-600",
  indigo: "text-indigo-600",
};

export const KpiCard = ({ label, value, hint, accent = "default" }: KpiCardProps) => (
  <div className="rounded-xl border bg-card p-5 shadow-sm">
    <div className="text-xs font-medium text-muted-foreground">{label}</div>
    <div className={cn("mt-2 text-2xl font-semibold tabular-nums", ACCENT_CLASS[accent])}>
      {value}
    </div>
    {hint !== undefined && (
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    )}
  </div>
);
