import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LuRefreshCw as RefreshCw, LuLoaderCircle as Loader2, LuTrendingUp as TrendingUp, LuTrophy as Trophy, LuUsers as Users, LuChartColumn as BarChart3 } from "react-icons/lu";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";

const BAR_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(221, 70%, 45%)",
  "hsl(210, 75%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(230, 70%, 55%)",
  "hsl(195, 65%, 48%)",
  "hsl(215, 80%, 52%)",
  "hsl(205, 65%, 45%)",
  "hsl(240, 60%, 55%)",
  "hsl(190, 60%, 50%)",
];

/** Converts "hsl(H, S%, L%)" to "hsla(H, S%, L%, a)" for valid alpha backgrounds. */
function hslWithAlpha(hsl: string, alpha: number): string {
  const match = hsl.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (!match) return hsl;
  const [, h, s, l] = match;
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

function truncateName(name: string, max = 10): string {
  if (name.length <= max) return name;
  return name.slice(0, max) + "...";
}

const CustomXAxisTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  const label = truncateName(payload?.value ?? "", 10);
  return (
    <text
      x={x}
      y={(y ?? 0) + 12}
      textAnchor="middle"
      fill="hsl(var(--muted-foreground))"
      fontSize={12}
      fontWeight={600}
    >
      {label}
    </text>
  );
};

export default function NavNodesActivity() {
  const { data: rawNodes, isLoading, refetch } = useQuery({
    queryKey: ["user-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ar_ropin_navnode")
        .select("user_id, ar_ropin_users(full_name, email)");
      if (error) throw error;
      return data as { user_id: string | null; ar_ropin_users: { full_name: string | null; email: string | null } | null }[];
    },
  });

  const chartData = useMemo(() => {
    if (!rawNodes) return [];
    const grouped: Record<string, { count: number; email: string }> = {};
    rawNodes.forEach((node) => {
      const name = node.ar_ropin_users?.full_name || node.ar_ropin_users?.email || null;
      if (!name) return; // skip rows with no named user
      if (!grouped[name]) {
        grouped[name] = { count: 0, email: node.ar_ropin_users?.email || "—" };
      }
      grouped[name].count++;
    });
    return Object.entries(grouped)
      .map(([name, { count, email }]) => ({
        name,
        points: count,
        created_by: email,
      }))
      .sort((a, b) => b.points - a.points);
  }, [rawNodes]);

  const totalPoints = rawNodes?.length ?? 0;
  const totalUsers = chartData.length;
  const topScore = chartData[0]?.points ?? 0;
  const chartWidth = Math.max(600, chartData.length * 110);

  const avgPoints = totalUsers > 0 ? (totalPoints / totalUsers).toFixed(1) : "0";
  const mostActiveUser = chartData[0]?.name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Activity"
        description="Visitor navigation activity across venues"
        actions={
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-ring"
            aria-label="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        }
        icon={<BarChart3 className="w-6 h-6" />}
      />

      {/* Summary stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" aria-label="Activity summary">
        <StatCard label="Total points" value={isLoading ? "—" : totalPoints} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Unique users" value={isLoading ? "—" : totalUsers} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Avg per user" value={isLoading ? "—" : avgPoints} description="Points per user" />
        <StatCard label="Most active" value={mostActiveUser} description="Top by points" icon={<Trophy className="w-5 h-5" />} />
      </section>

      {/* Activity chart */}
      <section className="section-card min-w-0 overflow-hidden" aria-label="Activity by user">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">Activity Points per User</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Every navigation action earns 1 point — taller bars mean more active users</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[250px] sm:h-[400px] text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Loading activity data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[250px] sm:h-[400px] text-muted-foreground">
            <img src="/favicon.ico" alt="Pinnacle" className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm font-medium">No activity recorded yet</p>
            <p className="text-xs mt-1">Activity will appear here once users start navigating</p>
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto scrollbar-glass -mx-2 px-2">
            <div style={{ width: chartWidth, minWidth: "100%", height: "min(400px, 55vw)" }} className="min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <defs>
                    {chartData.map((_, i) => (
                      <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BAR_COLORS[i % BAR_COLORS.length]} stopOpacity={1} />
                        <stop offset="100%" stopColor={BAR_COLORS[i % BAR_COLORS.length]} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsla(var(--muted-foreground), 0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={<CustomXAxisTick />}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    cursor={{ fill: "hsl(var(--border))", opacity: 0.3 }}
                  />
                  <Bar
                    dataKey="points"
                    radius={[12, 12, 4, 4]}
                    maxBarSize={70}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={`url(#barGrad${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* Leaderboard */}
      {chartData.length > 0 && (
        <section className="section-card mt-4 sm:mt-6" aria-label="Leaderboard">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Leaderboard</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Rankings based on total navigation activity — the more you explore, the higher you rank</p>
          <div className="space-y-2">
            {chartData.map((entry, i) => {
              const pct = topScore > 0 ? (entry.points / topScore) * 100 : 0;
              const barColor = BAR_COLORS[i % BAR_COLORS.length];
              return (
                <motion.div
                  key={entry.name}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/20 transition-colors group"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.08, type: "spring", bounce: 0.5 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: hslWithAlpha(barColor, 0.2),
                      color: barColor,
                    }}
                  >
                    #{i + 1}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-foreground">{entry.name}</span>
                      <span className="text-sm font-bold" style={{ color: barColor }}>
                        {entry.points} pts
                      </span>
                    </div>
                    <div
                      className="h-2.5 rounded-full overflow-hidden bg-muted/60"
                      role="progressbar"
                      aria-valuenow={Math.round(pct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${entry.name}: ${entry.points} points`}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.8 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full min-w-[4px]"
                        style={{ background: barColor }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Created by {entry.created_by}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
