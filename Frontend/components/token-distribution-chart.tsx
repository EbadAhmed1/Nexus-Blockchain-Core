"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = ["oklch(0.6 0.25 280)", "oklch(0.55 0.25 200)", "oklch(0.5 0.2 150)", "oklch(0.65 0.2 50)"]

interface TokenDistributionChartProps {
  data: { label: string; value: number }[]
}

export function TokenDistributionChart({ data }: TokenDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.label} ${entry.value.toFixed(1)}%`}
          outerRadius={90}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}
