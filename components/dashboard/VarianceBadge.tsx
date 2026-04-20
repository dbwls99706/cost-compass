import { cn } from "@/lib/utils";

type VarianceBadgeProps = {
  ratio: number;
  size?: "sm" | "md";
  showSign?: boolean;
};

export const VarianceBadge = ({ ratio, size = "sm", showSign = true }: VarianceBadgeProps) => {
  const pct = ratio * 100;
  const sign = showSign && pct > 0 ? "+" : "";
  const label = `${sign}${pct.toFixed(1)}%`;
  const tone =
    pct > 0
      ? "text-red-600 bg-red-50 border-red-200"
      : pct < 0
        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
        : "text-muted-foreground bg-muted border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium tabular-nums",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
        tone,
      )}
    >
      {label}
    </span>
  );
};
