import Link from "next/link";

import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { VarianceBadge } from "@/components/dashboard/VarianceBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listDivisionOptions, listProjects } from "@/lib/actions/cost-query";
import {
  calcVariance,
  formatKrwShort,
  ProjectStatus,
} from "@/lib/types/db";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{
  divisionId?: string;
  status?: string;
}>;

const parseStatus = (raw?: string): ProjectStatus | undefined => {
  if (raw === "PLANNING" || raw === "ACTIVE" || raw === "CLOSED") return raw;
  return undefined;
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters = {
    divisionId: sp.divisionId && sp.divisionId !== "all" ? sp.divisionId : undefined,
    status: parseStatus(sp.status),
  };

  const [projects, divisions] = await Promise.all([
    listProjects(filters),
    listDivisionOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">프로젝트</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {projects.length}개 프로젝트
          </p>
        </div>
        <FilterBar
          divisions={divisions}
          show={{ period: false, division: true, status: true }}
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">프로젝트</TableHead>
              <TableHead>코드</TableHead>
              <TableHead>본부</TableHead>
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
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  조건에 맞는 프로젝트가 없습니다
                </TableCell>
              </TableRow>
            )}
            {projects.map((p) => {
              const variance = calcVariance(p.standard, p.actual);
              const overBudget = variance.ratio > 0.3;
              return (
                <TableRow
                  key={p.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/40",
                    overBudget && "bg-destructive/5",
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
                  <TableCell className="text-sm">{p.divisionName}</TableCell>
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
                    <VarianceBadge ratio={variance.ratio} />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {p.itemCount}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
