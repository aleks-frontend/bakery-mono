import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts"
import { useDashboardStatsQuery } from "@/hooks/useDashboardStatsQuery"
import { useCyclesQuery } from "@/hooks/useCyclesQuery"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@bakery/api-client"

const STATUS_COLORS: Record<OrderStatus, string> = {
  NOT_RECEIVED: "#d97706",
  IN_PROGRESS: "#3b82f6",
  DELIVERED: "#059669",
}
const METRIC_COLOR = "#6366f1"

function formatRsd(n: number): string {
  return `${n.toLocaleString("sr-Latn-RS")} RSD`
}

function formatCompactRsd(n: number): string {
  if (Math.abs(n) < 1000) return String(n)
  const thousands = n / 1000
  const rounded = Number.isInteger(thousands) ? thousands : Math.round(thousands * 10) / 10
  return `${rounded}K`
}

const ARTICLE_NAME_MAX_CHARS = 26

function truncateArticleName(name: string): string {
  return name.length > ARTICLE_NAME_MAX_CHARS ? `${name.slice(0, ARTICLE_NAME_MAX_CHARS - 1)}…` : name
}

function ArticleNameTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const name = payload?.value ?? ""
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} className="fill-muted-foreground">
      <title>{name}</title>
      {truncateArticleName(name)}
    </text>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

function ChartCard({
  title,
  actions,
  children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  )
}

type TopArticlesScope = "cycle" | "allTime"

function TopArticlesScopeToggle({
  value,
  onChange,
}: {
  value: TopArticlesScope
  onChange: (value: TopArticlesScope) => void
}) {
  const { t } = useTranslation()
  const options: { value: TopArticlesScope; label: string }[] = [
    { value: "cycle", label: t("Selected cycle") },
    { value: "allTime", label: t("All time") },
  ]
  return (
    <div className="inline-flex rounded-md border p-0.5">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="xs"
          variant="ghost"
          className={cn(
            "h-6 px-2",
            value === option.value && "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { data: cycles = [] } = useCyclesQuery()
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(undefined)
  const [topArticlesScope, setTopArticlesScope] = useState<TopArticlesScope>("cycle")
  const { data: stats, isLoading, error } = useDashboardStatsQuery(selectedCycleId)

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("Loading dashboard...")}</p>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive font-medium mb-2">{t("Error loading dashboard")}</p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const statusData: { key: OrderStatus; label: string; value: number }[] = [
    { key: "NOT_RECEIVED", label: t("Not received"), value: stats.statusBreakdown.NOT_RECEIVED },
    { key: "IN_PROGRESS", label: t("In Progress"), value: stats.statusBreakdown.IN_PROGRESS },
    { key: "DELIVERED", label: t("Delivered"), value: stats.statusBreakdown.DELIVERED },
  ]
  const volumeData = stats.orderVolume.byCycle.map((c) => ({ label: c.label, count: c.count }))
  const revenueData = stats.revenue.byCycle.map((c) => ({ label: c.label, total: c.total }))

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("Dashboard")}</h1>
          <p className="text-muted-foreground">
            {t("Showing")}: {stats.scope.cycleLabel}
            {stats.scope.isCurrent ? ` (${t("current cycle")})` : ""}
          </p>
        </div>
        <Select
          value={selectedCycleId ?? stats.scope.cycleId}
          onValueChange={(value) => setSelectedCycleId(value)}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder={t("Select cycle...")} />
          </SelectTrigger>
          <SelectContent>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label={t("Total Orders")} value={String(stats.orderVolume.current)} />
        <StatTile label={t("Revenue")} value={formatRsd(stats.revenue.current)} />
        <StatTile label={t("Average Order Value")} value={formatRsd(stats.revenue.averageOrderValue)} />
      </div>

      <ChartCard title={t("Status Breakdown")}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={statusData} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <Tooltip />
            <Bar
              dataKey="value"
              maxBarSize={80}
              shape={(props: BarShapeProps) => {
                const { key: statusKey } = props.payload as { key: OrderStatus }
                return <Rectangle {...props} fill={STATUS_COLORS[statusKey]} radius={[4, 4, 0, 0]} />
              }}
            >
              <LabelList dataKey="value" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={t("Order Volume by Cycle")}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={volumeData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <Tooltip />
              <Bar dataKey="count" fill={METRIC_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("Revenue by Cycle")}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={formatCompactRsd}
              />
              <Tooltip formatter={(value) => formatRsd(Number(Array.isArray(value) ? value[0] : value))} />
              <Line type="monotone" dataKey="total" stroke={METRIC_COLOR} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title={t("Top Selling Articles")}
        actions={<TopArticlesScopeToggle value={topArticlesScope} onChange={setTopArticlesScope} />}
      >
        {(() => {
          const topArticlesData = topArticlesScope === "cycle" ? stats.topArticles : stats.topArticlesAllTime
          if (topArticlesData.length === 0) {
            return <p className="text-sm text-muted-foreground">{t("No articles")}</p>
          }
          return (
            <ResponsiveContainer width="100%" height={Math.max(160, topArticlesData.length * 36)}>
              <BarChart data={topArticlesData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={200}
                  interval={0}
                  tick={<ArticleNameTick />}
                />
                <Tooltip />
                <Bar dataKey="quantity" fill={METRIC_COLOR} radius={[0, 4, 4, 0]} maxBarSize={20}>
                  <LabelList dataKey="quantity" position="right" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        })()}
      </ChartCard>
    </div>
  )
}
