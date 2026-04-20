"use client";

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

const CATEGORIES: CostCategory[] = ["LABOR", "OUTSOURCE", "OPERATING", "COMMON"];

export const DivisionStackedBar = ({ data }: { data: Row[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        데이터가 없습니다
      </div>
    );
  }

  const chartData = data.map((row) => ({
    name: row.divisionName,
    LABOR: row.byCategory.LABOR,
    OUTSOURCE: row.byCategory.OUTSOURCE,
    OPERATING: row.byCategory.OPERATING,
    COMMON: row.byCategory.COMMON,
  }));

  return (
    <ResponsiveContainer width="100%" height={360} minWidth={0} minHeight={0}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
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
