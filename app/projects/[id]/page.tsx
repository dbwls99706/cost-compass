import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CategoryBadge } from "@/components/dashboard/CategoryBadge";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { ExportCsvButton } from "@/components/dashboard/ExportCsvButton";
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
import { getProjectDetail } from "@/lib/actions/cost-query";
import {
  calcVariance,
  formatKrwShort,
  type CostCategory,
  type ProjectStatus,
} from "@/lib/types/db";
import { cn } from "@/lib/utils";

type RouteParams = Promise<{ id: string }>;

const formatPeriodKo = (period: string) => {
  const [year, month] = period.split("-");
  return `${year}년 ${month}월`;
};

const CATEGORIES: CostCategory[] = ["LABOR", "OUTSOURCE", "OPERATING", "COMMON"];

export default async function ProjectDetailPage({ params }: { params: RouteParams }) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, costItems, summary } = detail;
  const totalVariance = calcVariance(summary.standard, summary.actual);

  const totalCategoryActual = CATEGORIES.reduce(
    (sum, cat) => sum + summary.byCategory[cat],
    0,
  );
  const pieData = CATEGORIES.map((category) => ({
    category,
    actual: summary.byCategory[category],
    ratio:
      totalCategoryActual === 0 ? 0 : summary.byCategory[category] / totalCategoryActual,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="size-4" />
          대시보드로
        </Link>
        <ExportCsvButton projectId={project.id} />
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
              <span>{project.code}</span>
              <span>·</span>
              <span>{project.division_.name}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          <StatusBadge status={project.status as ProjectStatus} />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="표준원가"
          value={`₩${formatKrwShort(summary.standard)}`}
          hint="계획 기준"
        />
        <KpiCard
          label="실제원가"
          value={`₩${formatKrwShort(summary.actual)}`}
          hint={`항목 ${costItems.length}건`}
          accent="indigo"
        />
        <KpiCard
          label="Variance"
          value={
            <span className="inline-flex items-center gap-2">
              {`₩${formatKrwShort(Math.abs(totalVariance.amount))}`}
              <VarianceBadge ratio={totalVariance.ratio} size="md" />
            </span>
          }
          hint={totalVariance.amount >= 0 ? "예산 초과" : "예산 절감"}
          accent={totalVariance.ratio > 0 ? "negative" : "positive"}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">월별 원가 추이</h2>
          <MonthlyTrendChart data={summary.byMonth} />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">카테고리별 비중</h2>
          <CategoryPieChart data={pieData} />
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">원가 항목 상세</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {costItems.length}건 · 내부대체 포함
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>기간</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>부담 본부</TableHead>
              <TableHead>출처 본부</TableHead>
              <TableHead className="text-right">표준</TableHead>
              <TableHead className="text-right">실제</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  등록된 원가 항목이 없습니다
                </TableCell>
              </TableRow>
            )}
            {costItems.map((item) => {
              const variance = calcVariance(item.standardAmount, item.actualAmount);
              return (
                <TableRow
                  key={item.id}
                  className={cn(variance.ratio > 0.3 && "bg-destructive/5")}
                >
                  <TableCell className="text-sm tabular-nums">
                    {formatPeriodKo(item.period)}
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={item.category as CostCategory} />
                  </TableCell>
                  <TableCell className="text-sm">{project.division_.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.isInterUnit ? item.sourceDivision?.name ?? "-" : "-"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    ₩{formatKrwShort(item.standardAmount)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums font-medium">
                    ₩{formatKrwShort(item.actualAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <VarianceBadge ratio={variance.ratio} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.notes ?? ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
