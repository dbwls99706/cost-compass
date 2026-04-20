"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, type ProjectStatus } from "@/lib/types/db";

const PERIOD_OPTIONS = [
  { value: "all", label: "전체 기간" },
  { value: "2026-04", label: "2026년 04월" },
  { value: "2026-03", label: "2026년 03월" },
  { value: "2026-02", label: "2026년 02월" },
  { value: "2026-01", label: "2026년 01월" },
  { value: "2025-12", label: "2025년 12월" },
  { value: "2025-11", label: "2025년 11월" },
];

const STATUS_OPTIONS: Array<{ value: "all" | ProjectStatus; label: string }> = [
  { value: "all", label: "전체 상태" },
  { value: "PLANNING", label: STATUS_LABELS.PLANNING },
  { value: "ACTIVE", label: STATUS_LABELS.ACTIVE },
  { value: "CLOSED", label: STATUS_LABELS.CLOSED },
];

type Division = { id: string; name: string };

type FilterBarProps = {
  divisions: Division[];
  show?: { period?: boolean; division?: boolean; status?: boolean };
};

export const FilterBar = ({
  divisions,
  show = { period: true, division: true, status: true },
}: FilterBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const pushParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    startTransition(() => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const period = searchParams.get("period") ?? "all";
  const divisionId = searchParams.get("divisionId") ?? "all";
  const status = searchParams.get("status") ?? "all";

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3"
      data-pending={pending ? "true" : "false"}
    >
      {show.period && (
        <Select value={period} onValueChange={(v: string | null) => pushParam("period", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {show.division && (
        <Select value={divisionId} onValueChange={(v: string | null) => pushParam("divisionId", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 본부</SelectItem>
            {divisions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {show.status && (
        <Select value={status} onValueChange={(v: string | null) => pushParam("status", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {pending && <span className="text-xs text-muted-foreground">갱신 중...</span>}
    </div>
  );
};
