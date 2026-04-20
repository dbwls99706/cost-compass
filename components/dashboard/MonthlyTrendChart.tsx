"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatKrwShort } from "@/lib/types/db";

type TrendPoint = { period: string; standard: number; actual: number };

const formatPeriodLabel = (period: string) => {
  const [, month] = period.split("-");
  return `${month}월`;
};

export const MonthlyTrendChart = ({ data }: { data: TrendPoint[] }) => {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        데이터가 없습니다
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="period"
          tickFormatter={formatPeriodLabel}
          tick={{ fontSize: 12, fill: "rgb(100 116 139)" }}
          tickLine={false}
          axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
        />
        <YAxis
          tickFormatter={(v: number) => formatKrwShort(v)}
          tick={{ fontSize: 11, fill: "rgb(100 116 139)" }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip
          formatter={(value, name) => [
            `₩${Number(value).toLocaleString("ko-KR")}`,
            String(name) === "standard" ? "표준원가" : "실제원가",
          ]}
          labelFormatter={(label) => formatPeriodLabel(String(label))}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.1)",
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="standard"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: "#94a3b8" }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#4f46e5"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#4f46e5" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
