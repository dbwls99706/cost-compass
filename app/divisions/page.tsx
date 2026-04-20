import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { VarianceBadge } from "@/components/dashboard/VarianceBadge";
import { listDivisions } from "@/lib/actions/cost-query";
import { formatKrwShort } from "@/lib/types/db";

export default async function DivisionsPage() {
  const divisions = await listDivisions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">본부 현황</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          5개 본부의 원가 집계를 한눈에 비교한다
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {divisions.map((d) => (
          <Link
            key={d.id}
            href={`/divisions/${d.id}`}
            className="group rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-muted/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">{d.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  인원 {d.headcount}명 · 프로젝트 {d.projectCount}개
                  {d.activeProjectCount > 0 && ` (진행 ${d.activeProjectCount}개)`}
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>

            <div className="mt-6 space-y-1">
              <div className="text-xs text-muted-foreground">실제 원가</div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold tabular-nums text-indigo-600">
                  ₩{formatKrwShort(d.actual)}
                </span>
                <VarianceBadge ratio={d.varianceRatio} />
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                표준 ₩{formatKrwShort(d.standard)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
