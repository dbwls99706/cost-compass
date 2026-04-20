import Link from "next/link";

import { CategoryBadge } from "@/components/dashboard/CategoryBadge";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { DivisionStackedBar } from "@/components/dashboard/DivisionStackedBar";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { TopProjectsBar } from "@/components/dashboard/TopProjectsBar";
import { VarianceBadge } from "@/components/dashboard/VarianceBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getDashboardStats,
  listDivisionOptions,
  listRecentCostItems,
} from "@/lib/actions/cost-query";
import { formatKrwShort, ProjectStatus } from "@/lib/types/db";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{
  period?: string;
  divisionId?: string;
  status?: string;
}>;

const parseStatus = (raw?: string): ProjectStatus | undefined => {
  if (raw === "PLANNING" || raw === "ACTIVE" || raw === "CLOSED") return raw;
  return undefined;
};

const formatPeriodKo = (period: string): string => {
  if (period === "-" || !period) return "-";
  if (period.includes("~")) {
    const [a, b] = period.split("~").map((s) => s.trim());
    return `${formatPeriodKo(a)} ~ ${formatPeriodKo(b)}`;
  }
  const [year, month] = period.split("-");
  return `${year}년 ${month}월`;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters = {
    period: sp.period && sp.period !== "all" ? sp.period : undefined,
    divisionId: sp.divisionId && sp.divisionId !== "all" ? sp.divisionId : undefined,
    status: parseStatus(sp.status),
  };

  const [stats, divisions, recentItems] = await Promise.all([
    getDashboardStats(filters),
    listDivisionOptions(),
    listRecentCostItems(10),
  ]);

  const { kpis, divisionBreakdown, topProjectsByActual, monthlyTrend, categoryBreakdown } =
    stats;

  const varianceHint =
    kpis.totalStandard === 0
      ? "기준 원가 없음"
      : `표준 대비 ${kpis.variance.ratio >= 0 ? "+" : ""}${(kpis.variance.ratio * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">원가 대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatPeriodKo(stats.range.period)} 기준 전사 원가 집계
          </p>
        </div>
        <FilterBar divisions={divisions} />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="전체 실제 원가"
          value={`₩${formatKrwShort(kpis.totalActual)}`}
          hint={varianceHint}
          accent="indigo"
        />
        <KpiCard
          label="진행 중 프로젝트"
          value={`${kpis.activeProjectCount}개`}
          hint="ACTIVE 상태 기준"
        />
        <KpiCard
          label="Variance 비율"
          value={`${kpis.variance.ratio >= 0 ? "+" : ""}${(kpis.variance.ratio * 100).toFixed(1)}%`}
          hint={`₩${formatKrwShort(Math.abs(kpis.variance.amount))} ${kpis.variance.amount >= 0 ? "초과" : "절감"}`}
          accent={kpis.variance.ratio > 0 ? "negative" : "positive"}
        />
        <KpiCard
          label="내부대체 비중"
          value={`${(kpis.interUnitRatio * 100).toFixed(1)}%`}
          hint="전체 실제 원가 대비"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">월별 원가 추이</h2>
            <span className="text-xs text-muted-foreground">표준 vs 실제</span>
          </div>
          <MonthlyTrendChart data={monthlyTrend} />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">카테고리별 비중</h2>
          </div>
          <CategoryPieChart data={categoryBreakdown} />
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">본부별 원가 (카테고리 스택)</h2>
          <span className="text-xs text-muted-foreground">실제 원가 기준</span>
        </div>
        <DivisionStackedBar data={divisionBreakdown} />
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">프로젝트 Top 10</h2>
          <span className="text-xs text-muted-foreground">행 클릭 시 상세로 이동</span>
        </div>
        <TopProjectsBar data={topProjectsByActual} />
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold">최근 집행 원가 항목</h2>
          <Link
            href="/projects"
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            프로젝트 전체 보기 →
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44%]">프로젝트</TableHead>
              <TableHead>본부</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>기간</TableHead>
              <TableHead className="text-right">표준</TableHead>
              <TableHead className="text-right">실제</TableHead>
              <TableHead className="text-right">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  원가 항목이 없습니다
                </TableCell>
              </TableRow>
            )}
            {recentItems.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  item.varianceRatio > 0.3 && "bg-destructive/5",
                )}
              >
                <TableCell>
                  <Link
                    href={`/projects/${item.projectId}`}
                    className="flex flex-col hover:underline"
                  >
                    <span className="text-sm font-medium">{item.projectName}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {item.projectCode}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{item.divisionName}</TableCell>
                <TableCell>
                  <CategoryBadge category={item.category} />
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {formatPeriodKo(item.period)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                  ₩{formatKrwShort(item.standardAmount)}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums font-medium">
                  ₩{formatKrwShort(item.actualAmount)}
                </TableCell>
                <TableCell className="text-right">
                  <VarianceBadge ratio={item.varianceRatio} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
