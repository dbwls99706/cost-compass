"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CATEGORY_FILL } from "@/components/dashboard/CategoryBadge";
import { CATEGORY_LABELS, formatKrwShort, type CostCategory } from "@/lib/types/db";

type Row = {
  divisionId: string;
  divisionName: string;
  actual: number;
  standard: number;
  byCategory: Record<CostCategory, number>;
};

type ChartPoint = {
  divisionId: string;
  name: string;
  LABOR: number;
  OUTSOURCE: number;
  OPERATING: number;
  COMMON: number;
};

const CATEGORIES: CostCategory[] = ["LABOR", "OUTSOURCE", "OPERATING", "COMMON"];

export const DivisionStackedBar = ({ data }: { data: Row[] }) => {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        데이터가 없습니다
      </div>
    );
  }

  const chartData: ChartPoint[] = data.map((row) => ({
    divisionId: row.divisionId,
    name: row.divisionName,
    LABOR: row.byCategory.LABOR,
    OUTSOURCE: row.byCategory.OUTSOURCE,
    OPERATING: row.byCategory.OPERATING,
    COMMON: row.byCategory.COMMON,
  }));

  return (
    <ResponsiveContainer width="100%" height={360} minWidth={0} minHeight={0}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          const state = e as unknown as {
            activePayload?: Array<{ payload?: ChartPoint }>;
          } | null;
          const payload = state?.activePayload?.[0]?.payload;
          if (payload?.divisionId) router.push(`/divisions/${payload.divisionId}`);
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "rgb(100 116 139)" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
        />
        <YAxis
          tickFormatter={(v: number) => formatKrwShort(v)}
          tick={{ fontSize: 11, fill: "rgb(100 116 139)" }}
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <Tooltip
          formatter={(value, name) => [
            `₩${Number(value).toLocaleString("ko-KR")}`,
            CATEGORY_LABELS[String(name) as CostCategory],
          ]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.1)",
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(99,102,241,0.06)" }}
        />
        <Legend
          formatter={(value) => CATEGORY_LABELS[value as CostCategory]}
          wrapperStyle={{ fontSize: 12 }}
        />
        {CATEGORIES.map((cat) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="cost"
            fill={CATEGORY_FILL[cat]}
            radius={cat === "COMMON" ? [4, 4, 0, 0] : 0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};
