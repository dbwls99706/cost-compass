"use server";

import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, calcVariance, type CostCategory } from "@/lib/types/db";

type CsvResult =
  | { ok: true; filename: string; content: string }
  | { ok: false; error: string };

const escapeCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const toCsvRow = (cells: Array<string | number | null | undefined>): string =>
  cells.map(escapeCell).join(",");

const formatTimestamp = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`
  );
};

export async function exportProjectCostCsv(projectId: string): Promise<CsvResult> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { division_: true },
    });
    if (!project) return { ok: false, error: "프로젝트를 찾을 수 없습니다" };

    const items = await prisma.costItem.findMany({
      where: { projectId },
      include: { division: true, sourceDivision: true },
      orderBy: [{ period: "asc" }, { category: "asc" }],
    });

    const header = [
      "기간",
      "카테고리",
      "부담 본부",
      "출처 본부",
      "표준원가",
      "실제원가",
      "Variance(%)",
      "내부대체",
      "비고",
    ];

    const rows = items.map((item) => {
      const variance = calcVariance(item.standardAmount, item.actualAmount);
      return toCsvRow([
        item.period,
        CATEGORY_LABELS[item.category as CostCategory] ?? item.category,
        item.division.name,
        item.sourceDivision?.name ?? "",
        item.standardAmount,
        item.actualAmount,
        (variance.ratio * 100).toFixed(2),
        item.isInterUnit ? "Y" : "N",
        item.notes ?? "",
      ]);
    });

    const content = "\uFEFF" + [toCsvRow(header), ...rows].join("\r\n") + "\r\n";
    const filename = `project-${project.code}-${formatTimestamp(new Date())}.csv`;

    return { ok: true, filename, content };
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return { ok: false, error: message };
  }
}
