import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { VarianceBadge } from "@/components/dashboard/VarianceBadge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDivisionDetail } from "@/lib/actions/cost-query";
import { formatKrwShort } from "@/lib/types/db";
import { cn } from "@/lib/utils";

type RouteParams = Promise<{ id: string }>;

export default async function DivisionDetailPage({
  params,
}: {
  params: RouteParams;
}) {
  const { id } = await params;
  const detail = await getDivisionDetail(id);
  if (!detail) notFound();

  const { division, kpis, projects, monthlyTrend, categoryBreakdown } = detail;

  const varianceHint =
    kpis.standard === 0
      ? "기준 원가 없음"
      : `표준 대비 ${kpis.variance.ratio >= 0 ? "+" : ""}${(kpis.variance.ratio * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <Link
        href="/divisions"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="size-4" />
        본부 목록
      </Link>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{division.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          인원 {division.headcount}명 · 프로젝트 {kpis.projectCount}개 · 진행{" "}
          {kpis.activeProjectCount}개
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="실제 원가"
          value={`₩${formatKrwShort(kpis.actual)}`}
          hint={varianceHint}
          accent="indigo"
        />
        <KpiCard
          label="표준 원가"
          value={`₩${formatKrwShort(kpis.standard)}`}
          hint="계획 기준"
        />
        <KpiCard
          label="프로젝트"
          value={`${kpis.activeProjectCount} / ${kpis.projectCount}`}
          hint="진행 / 전체"
        />
        <KpiCard
          label="내부대체 비중"
          value={`${(kpis.interUnitRatio * 100).toFixed(1)}%`}
          hint="실제 원가 대비"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">월별 원가 추이</h2>
          <MonthlyTrendChart data={monthlyTrend} />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">카테고리별 비중</h2>
          <CategoryPieChart data={categoryBreakdown} />
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">소속 프로젝트</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {projects.length}개 · 실제 원가 내림차순
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">프로젝트</TableHead>
              <TableHead>코드</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">표준</TableHead>
              <TableHead className="text-right">실제</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="text-right">항목 수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  소속 프로젝트가 없습니다
                </TableCell>
              </TableRow>
            )}
            {projects.map((p) => (
              <TableRow
                key={p.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/40",
                  p.varianceRatio > 0.3 && "bg-destructive/5",
                )}
              >
                <TableCell>
                  <Link
                    href={`/projects/${p.id}`}
                    className="block font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {p.code}
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  ₩{formatKrwShort(p.standard)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums font-medium">
                  ₩{formatKrwShort(p.actual)}
                </TableCell>
                <TableCell className="text-right">
                  <VarianceBadge ratio={p.varianceRatio} />
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  {p.itemCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
