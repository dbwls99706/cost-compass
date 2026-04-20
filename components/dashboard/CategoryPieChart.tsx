"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { CATEGORY_FILL } from "@/components/dashboard/CategoryBadge";
import { CATEGORY_LABELS, type CostCategory } from "@/lib/types/db";

type Slice = { category: CostCategory; actual: number; ratio: number };

export const CategoryPieChart = ({ data }: { data: Slice[] }) => {
  const filtered = data.filter((d) => d.actual > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={filtered}
            dataKey="actual"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={90}
            paddingAngle={1}
            stroke="none"
          >
            {filtered.map((slice) => (
              <Cell key={slice.category} fill={CATEGORY_FILL[slice.category]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`₩${Number(value).toLocaleString("ko-KR")}`, "실제"]}
            labelFormatter={(_, items) => {
              const first = items[0] as { payload?: { category?: CostCategory } } | undefined;
              const key = first?.payload?.category;
              return key ? CATEGORY_LABELS[key] : "";
            }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.1)",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="grid grid-cols-2 gap-2 text-xs">
        {filtered.map((slice) => (
          <li key={slice.category} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ backgroundColor: CATEGORY_FILL[slice.category] }}
            />
            <span className="text-foreground/80">
              {CATEGORY_LABELS[slice.category]}
            </span>
            <span className="ml-auto tabular-nums text-muted-foreground">
              {(slice.ratio * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
