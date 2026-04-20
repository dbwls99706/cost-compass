"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatKrwShort } from "@/lib/types/db";

type TopProject = {
  projectId: string;
  projectName: string;
  code: string;
  actual: number;
  standard: number;
  varianceRatio: number;
};

const truncate = (s: string, max = 18) =>
  s.length > max ? s.slice(0, max - 1) + "…" : s;

export const TopProjectsBar = ({ data }: { data: TopProject[] }) => {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        데이터가 없습니다
      </div>
    );
  }

  const chartData = data.map((p) => ({
    ...p,
    display: truncate(p.projectName),
    varianceLabel: p.varianceRatio > 0 ? `+${(p.varianceRatio * 100).toFixed(1)}%` : "",
  }));

  const height = Math.max(320, chartData.length * 44);

  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0} minHeight={0}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 56, bottom: 0, left: 8 }}
        onClick={(e) => {
          const state = e as unknown as {
            activePayload?: Array<{ payload?: TopProject }>;
          } | null;
          const payload = state?.activePayload?.[0]?.payload;
          if (payload?.projectId) router.push(`/projects/${payload.projectId}`);
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatKrwShort(v)}
          tick={{ fontSize: 11, fill: "rgb(100 116 139)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="display"
          tick={{ fontSize: 12, fill: "rgb(51 65 85)" }}
          width={140}
          tickLine={false}
          axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
        />
        <Tooltip
          formatter={(value, name) => [
            `₩${Number(value).toLocaleString("ko-KR")}`,
            String(name) === "standard" ? "표준" : "실제",
          ]}
          labelFormatter={(_, items) => {
            const first = items[0] as { payload?: TopProject } | undefined;
            const p = first?.payload;
            return p ? `${p.code} · ${p.projectName}` : "";
          }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.1)",
            fontSize: 12,
          }}
          cursor={{ fill: "rgba(99,102,241,0.06)" }}
        />
        <Bar dataKey="standard" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={10} />
        <Bar dataKey="actual" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={10}>
          <LabelList
            dataKey="varianceLabel"
            position="right"
            style={{ fill: "#dc2626", fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
