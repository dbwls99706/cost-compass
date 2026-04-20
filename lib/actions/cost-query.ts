"use server";

import { prisma } from "@/lib/prisma";
import type {
  CostItemModel,
  DivisionModel,
  ProjectModel,
} from "@/lib/generated/prisma/models";
import {
  CostCategory,
  ProjectStatus,
  calcVariance,
} from "@/lib/types/db";

type DashboardFilters = {
  period?: string;
  divisionId?: string;
  status?: ProjectStatus;
};

type DashboardStats = {
  range: { period: string };
  kpis: {
    totalActual: number;
    totalStandard: number;
    variance: { amount: number; ratio: number };
    activeProjectCount: number;
    interUnitRatio: number;
  };
  divisionBreakdown: Array<{
    divisionId: string;
    divisionName: string;
    actual: number;
    standard: number;
    byCategory: Record<CostCategory, number>;
  }>;
  topProjectsByActual: Array<{
    projectId: string;
    projectName: string;
    code: string;
    divisionName: string;
    status: ProjectStatus;
    actual: number;
    standard: number;
    varianceRatio: number;
  }>;
  monthlyTrend: Array<{
    period: string;
    actual: number;
    standard: number;
  }>;
  categoryBreakdown: Array<{
    category: CostCategory;
    actual: number;
    ratio: number;
  }>;
};

const ALL_CATEGORIES: CostCategory[] = ["LABOR", "OUTSOURCE", "OPERATING", "COMMON"];

const emptyCategoryBucket = (): Record<CostCategory, number> => ({
  LABOR: 0,
  OUTSOURCE: 0,
  OPERATING: 0,
  COMMON: 0,
});

export async function getDashboardStats(
  filters: DashboardFilters = {},
): Promise<DashboardStats> {
  const [divisions, projects, costItems] = await Promise.all([
    prisma.division.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany(),
    prisma.costItem.findMany(),
  ]);

  const divisionById = new Map(divisions.map((d) => [d.id, d]));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const allowedProjectIds = new Set(
    projects
      .filter((p) => !filters.status || p.status === filters.status)
      .map((p) => p.id),
  );

  const filteredItems = costItems.filter((item) => {
    if (!allowedProjectIds.has(item.projectId)) return false;
    if (filters.divisionId && item.divisionId !== filters.divisionId) return false;
    if (filters.period && item.period !== filters.period) return false;
    return true;
  });

  const totalActual = filteredItems.reduce((sum, i) => sum + i.actualAmount, 0);
  const totalStandard = filteredItems.reduce((sum, i) => sum + i.standardAmount, 0);

  const activeProjectIds = new Set(
    projects.filter((p) => p.status === "ACTIVE").map((p) => p.id),
  );
  const activeProjectCount = Array.from(allowedProjectIds).filter((id) =>
    activeProjectIds.has(id),
  ).length;

  const interUnitActual = filteredItems
    .filter((i) => i.isInterUnit)
    .reduce((sum, i) => sum + i.actualAmount, 0);
  const interUnitRatio = totalActual === 0 ? 0 : interUnitActual / totalActual;

  const divisionBuckets = new Map<
    string,
    { actual: number; standard: number; byCategory: Record<CostCategory, number> }
  >();
  for (const item of filteredItems) {
    const bucket =
      divisionBuckets.get(item.divisionId) ??
      { actual: 0, standard: 0, byCategory: emptyCategoryBucket() };
    bucket.actual += item.actualAmount;
    bucket.standard += item.standardAmount;
    bucket.byCategory[item.category as CostCategory] += item.actualAmount;
    divisionBuckets.set(item.divisionId, bucket);
  }

  const divisionBreakdown = Array.from(divisionBuckets.entries())
    .map(([divisionId, bucket]) => ({
      divisionId,
      divisionName: divisionById.get(divisionId)?.name ?? "(unknown)",
      actual: bucket.actual,
      standard: bucket.standard,
      byCategory: bucket.byCategory,
    }))
    .sort((a, b) => b.actual - a.actual);

  const projectBuckets = new Map<string, { actual: number; standard: number }>();
  for (const item of filteredItems) {
    const bucket = projectBuckets.get(item.projectId) ?? { actual: 0, standard: 0 };
    bucket.actual += item.actualAmount;
    bucket.standard += item.standardAmount;
    projectBuckets.set(item.projectId, bucket);
  }

  const topProjectsByActual = Array.from(projectBuckets.entries())
    .map(([projectId, bucket]) => {
      const project = projectById.get(projectId);
      const division = project ? divisionById.get(project.divisionId) : undefined;
      return {
        projectId,
        projectName: project?.name ?? "(unknown)",
        code: project?.code ?? "",
        divisionName: division?.name ?? "(unknown)",
        status: (project?.status ?? "PLANNING") as ProjectStatus,
        actual: bucket.actual,
        standard: bucket.standard,
        varianceRatio: calcVariance(bucket.standard, bucket.actual).ratio,
      };
    })
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 10);

  const trendSource = costItems.filter((item) => {
    if (!allowedProjectIds.has(item.projectId)) return false;
    if (filters.divisionId && item.divisionId !== filters.divisionId) return false;
    return true;
  });

  const periodBuckets = new Map<string, { actual: number; standard: number }>();
  for (const item of trendSource) {
    const bucket = periodBuckets.get(item.period) ?? { actual: 0, standard: 0 };
    bucket.actual += item.actualAmount;
    bucket.standard += item.standardAmount;
    periodBuckets.set(item.period, bucket);
  }
  const monthlyTrend = Array.from(periodBuckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-6)
    .map(([period, bucket]) => ({
      period,
      actual: bucket.actual,
      standard: bucket.standard,
    }));

  const categoryTotals = emptyCategoryBucket();
  for (const item of filteredItems) {
    categoryTotals[item.category as CostCategory] += item.actualAmount;
  }
  const categoryBreakdown = ALL_CATEGORIES.map((category) => ({
    category,
    actual: categoryTotals[category],
    ratio: totalActual === 0 ? 0 : categoryTotals[category] / totalActual,
  }));

  const rangeLabel = (() => {
    if (filters.period) return filters.period;
    if (monthlyTrend.length === 0) return "-";
    const first = monthlyTrend[0].period;
    const last = monthlyTrend[monthlyTrend.length - 1].period;
    return first === last ? first : `${first} ~ ${last}`;
  })();

  return {
    range: { period: rangeLabel },
    kpis: {
      totalActual,
      totalStandard,
      variance: calcVariance(totalStandard, totalActual),
      activeProjectCount,
      interUnitRatio,
    },
    divisionBreakdown,
    topProjectsByActual,
    monthlyTrend,
    categoryBreakdown,
  };
}

type ProjectListItem = {
  id: string;
  name: string;
  code: string;
  divisionName: string;
  status: ProjectStatus;
  actual: number;
  standard: number;
  itemCount: number;
};

export async function listProjects(filters: {
  divisionId?: string;
  status?: ProjectStatus;
} = {}): Promise<ProjectListItem[]> {
  const [projects, costItems] = await Promise.all([
    prisma.project.findMany({
      where: {
        divisionId: filters.divisionId,
        status: filters.status,
      },
      include: { division_: true },
      orderBy: { code: "asc" },
    }),
    prisma.costItem.findMany(),
  ]);

  const buckets = new Map<string, { actual: number; standard: number; count: number }>();
  for (const item of costItems) {
    const bucket =
      buckets.get(item.projectId) ?? { actual: 0, standard: 0, count: 0 };
    bucket.actual += item.actualAmount;
    bucket.standard += item.standardAmount;
    bucket.count += 1;
    buckets.set(item.projectId, bucket);
  }

  return projects.map((p) => {
    const bucket = buckets.get(p.id) ?? { actual: 0, standard: 0, count: 0 };
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      divisionName: p.division_.name,
      status: p.status as ProjectStatus,
      actual: bucket.actual,
      standard: bucket.standard,
      itemCount: bucket.count,
    };
  });
}

type ProjectDetail = {
  project: ProjectModel & { division_: DivisionModel };
  costItems: Array<CostItemModel & { sourceDivision: DivisionModel | null }>;
  summary: {
    actual: number;
    standard: number;
    byCategory: Record<CostCategory, number>;
    byMonth: Array<{ period: string; actual: number; standard: number }>;
  };
};

export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { division_: true },
  });
  if (!project) return null;

  const costItems = await prisma.costItem.findMany({
    where: { projectId: id },
    include: { sourceDivision: true },
    orderBy: [{ period: "asc" }, { category: "asc" }],
  });

  const byCategory = emptyCategoryBucket();
  const monthBuckets = new Map<string, { actual: number; standard: number }>();
  let actual = 0;
  let standard = 0;

  for (const item of costItems) {
    actual += item.actualAmount;
    standard += item.standardAmount;
    byCategory[item.category as CostCategory] += item.actualAmount;
    const bucket = monthBuckets.get(item.period) ?? { actual: 0, standard: 0 };
    bucket.actual += item.actualAmount;
    bucket.standard += item.standardAmount;
    monthBuckets.set(item.period, bucket);
  }

  const byMonth = Array.from(monthBuckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([period, bucket]) => ({
      period,
      actual: bucket.actual,
      standard: bucket.standard,
    }));

  return {
    project,
    costItems,
    summary: { actual, standard, byCategory, byMonth },
  };
}

export async function listDivisionOptions(): Promise<
  Array<{ id: string; name: string }>
> {
  const divisions = await prisma.division.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return divisions;
}

type RecentCostItem = {
  id: string;
  period: string;
  category: CostCategory;
  projectName: string;
  projectCode: string;
  projectId: string;
  divisionName: string;
  standardAmount: number;
  actualAmount: number;
  varianceRatio: number;
  isInterUnit: boolean;
};

export async function listRecentCostItems(limit = 10): Promise<RecentCostItem[]> {
  const items = await prisma.costItem.findMany({
    orderBy: [{ period: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      project: { include: { division_: true } },
      division: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    period: item.period,
    category: item.category as CostCategory,
    projectName: item.project.name,
    projectCode: item.project.code,
    projectId: item.project.id,
    divisionName: item.division.name,
    standardAmount: item.standardAmount,
    actualAmount: item.actualAmount,
    varianceRatio: calcVariance(item.standardAmount, item.actualAmount).ratio,
    isInterUnit: item.isInterUnit,
  }));
}

type DivisionListRow = {
  id: string;
  name: string;
  headcount: number;
  projectCount: number;
  activeProjectCount: number;
  actual: number;
  standard: number;
  varianceRatio: number;
};

export async function listDivisions(): Promise<DivisionListRow[]> {
  const [divisions, projects, costItems] = await Promise.all([
    prisma.division.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ select: { id: true, divisionId: true, status: true } }),
    prisma.costItem.findMany({
      select: { divisionId: true, standardAmount: true, actualAmount: true },
    }),
  ]);

  const projectStats = new Map<string, { total: number; active: number }>();
  for (const p of projects) {
    const stats = projectStats.get(p.divisionId) ?? { total: 0, active: 0 };
    stats.total += 1;
    if (p.status === "ACTIVE") stats.active += 1;
    projectStats.set(p.divisionId, stats);
  }

  const costBuckets = new Map<string, { actual: number; standard: number }>();
  for (const item of costItems) {
    const bucket =
      costBuckets.get(item.divisionId) ?? { actual: 0, standard: 0 };
    bucket.actual += item.actualAmount;
    bucket.standard += item.standardAmount;
    costBuckets.set(item.divisionId, bucket);
  }

  return divisions
    .map((d) => {
      const stats = projectStats.get(d.id) ?? { total: 0, active: 0 };
      const costs = costBuckets.get(d.id) ?? { actual: 0, standard: 0 };
      return {
        id: d.id,
        name: d.name,
        headcount: d.headcount,
        projectCount: stats.total,
        activeProjectCount: stats.active,
        actual: costs.actual,
        standard: costs.standard,
        varianceRatio: calcVariance(costs.standard, costs.actual).ratio,
      };
    })
    .sort((a, b) => b.actual - a.actual);
}

type DivisionDetail = {
  division: DivisionModel;
  kpis: {
    actual: number;
    standard: number;
    variance: { amount: number; ratio: number };
    projectCount: number;
    activeProjectCount: number;
    interUnitRatio: number;
  };
  projects: Array<{
    id: string;
    name: string;
    code: string;
    status: ProjectStatus;
    actual: number;
    standard: number;
    varianceRatio: number;
    itemCount: number;
  }>;
  monthlyTrend: Array<{ period: string; actual: number; standard: number }>;
  categoryBreakdown: Array<{
    category: CostCategory;
    actual: number;
    ratio: number;
  }>;
};

const ALL_CATEGORY_KEYS: CostCategory[] = ["LABOR", "OUTSOURCE", "OPERATING", "COMMON"];

export async function getDivisionDetail(id: string): Promise<DivisionDetail | null> {
  const division = await prisma.division.findUnique({ where: { id } });
  if (!division) return null;

  const [projects, costItems] = await Promise.all([
    prisma.project.findMany({
      where: { divisionId: id },
      orderBy: { code: "asc" },
    }),
    prisma.costItem.findMany({ where: { divisionId: id } }),
  ]);

  const perProject = new Map<
    string,
    { actual: number; standard: number; count: number }
  >();
  const monthBuckets = new Map<string, { actual: number; standard: number }>();
  const categoryActual = emptyCategoryBucket();

  let actualTotal = 0;
  let standardTotal = 0;
  let interUnitActual = 0;

  for (const item of costItems) {
    actualTotal += item.actualAmount;
    standardTotal += item.standardAmount;
    if (item.isInterUnit) interUnitActual += item.actualAmount;

    const proj = perProject.get(item.projectId) ?? {
      actual: 0,
      standard: 0,
      count: 0,
    };
    proj.actual += item.actualAmount;
    proj.standard += item.standardAmount;
    proj.count += 1;
    perProject.set(item.projectId, proj);

    const month = monthBuckets.get(item.period) ?? { actual: 0, standard: 0 };
    month.actual += item.actualAmount;
    month.standard += item.standardAmount;
    monthBuckets.set(item.period, month);

    categoryActual[item.category as CostCategory] += item.actualAmount;
  }

  const projectRows = projects
    .map((p) => {
      const bucket = perProject.get(p.id) ?? { actual: 0, standard: 0, count: 0 };
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status as ProjectStatus,
        actual: bucket.actual,
        standard: bucket.standard,
        varianceRatio: calcVariance(bucket.standard, bucket.actual).ratio,
        itemCount: bucket.count,
      };
    })
    .sort((a, b) => b.actual - a.actual);

  const activeProjectCount = projects.filter((p) => p.status === "ACTIVE").length;

  const monthlyTrend = Array.from(monthBuckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([period, bucket]) => ({
      period,
      actual: bucket.actual,
      standard: bucket.standard,
    }));

  const categoryBreakdown = ALL_CATEGORY_KEYS.map((category) => ({
    category,
    actual: categoryActual[category],
    ratio: actualTotal === 0 ? 0 : categoryActual[category] / actualTotal,
  }));

  return {
    division,
    kpis: {
      actual: actualTotal,
      standard: standardTotal,
      variance: calcVariance(standardTotal, actualTotal),
      projectCount: projects.length,
      activeProjectCount,
      interUnitRatio: actualTotal === 0 ? 0 : interUnitActual / actualTotal,
    },
    projects: projectRows,
    monthlyTrend,
    categoryBreakdown,
  };
}
