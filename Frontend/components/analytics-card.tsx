import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsCardProps {
  label: string
  value: string
  changeLabel?: string
  change?: number
}

export function AnalyticsCard({ label, value, change, changeLabel }: AnalyticsCardProps) {
  const derivedChangeLabel =
    changeLabel ?? (typeof change === "number" ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%` : null)
  const isPositive = derivedChangeLabel ? derivedChangeLabel.startsWith("+") : true

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold">{value}</p>
            {derivedChangeLabel ? (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm",
                  isPositive ? "text-emerald-400" : "text-destructive",
                )}
              >
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {derivedChangeLabel}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
