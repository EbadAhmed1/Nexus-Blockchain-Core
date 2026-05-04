"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TransactionChartProps {
  data: { label: string; value: number }[]
}

export function TransactionChart({ data }: TransactionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.map((entry) => ({ name: entry.label, value: entry.value }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" />
        <XAxis dataKey="name" stroke="oklch(0.65 0 0)" style={{ fontSize: "12px" }} />
        <YAxis stroke="oklch(0.65 0 0)" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.12 0 0)",
            border: "1px solid oklch(0.18 0 0)",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "oklch(0.95 0 0)" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="oklch(0.55 0.25 200)"
          dot={{ fill: "oklch(0.55 0.25 200)", r: 4 }}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
