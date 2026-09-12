"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";

type Point = {
  standardLevel: string;
  avgTotalComp: number | null;
};

export function LevelChart({ data }: { data: Point[] }) {
  const chartData = data
    .filter((row) => row.avgTotalComp !== null)
    .map((row) => ({
      level: row.standardLevel,
      avg: row.avgTotalComp,
    }));

  if (chartData.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No compensation data to chart yet.
      </p>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="level" />
          <YAxis tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Standard level ${label}`}
          />
          <Bar dataKey="avg" name="Avg total comp" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
