import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LuBuilding2 as Building2,
  LuLayers as Layers,
  LuLayoutGrid as LayoutGrid,
  LuMapPin as MapPin,
  LuDoorOpen as DoorOpen,
  LuUsers as Users,
  LuArrowRight as ArrowRight,
  LuActivity as Activity,
  LuNavigation as Navigation,
  LuClock as Clock,
  LuRoute as Route,
  LuCircleCheck as CheckCircle,
  LuChartBar as BarChart3,
  LuTrendingUp as TrendingUp,
  LuSearch as Search,
  LuBox as Box,
} from "react-icons/lu";
import { supabase } from "@/lib/supabase";
import { tableOrder, tableConfigs } from "@/lib/tableConfig";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  CORE_KPIS,
  NAVIGATION_USAGE,
  NAVIGATION_COMPLETION,
  SEARCH_ANALYTICS,
  TECHNICIAN_ACTIVITY,
  ROUTE_EFFICIENCY,
  ASSET_NAVIGATION,
  USER_ENGAGEMENT,
  CHART_COLORS,
} from "@/data/analyticsData";

// ─── Supabase data fetchers ─────────────────────────────
const routeMap: Record<string, string> = {
  ar_ropin_buildings: "/room-categories",
  ar_ropin_floors: "/room-information",
  ar_ropin_zones: "/rooms",
  ar_ropin_pois: "/pois",
  ar_ropin_entries: "/passages",
  ar_ropin_users: "/users",
};

const iconMap: Record<string, typeof DoorOpen> = {
  ar_ropin_buildings: Building2,
  ar_ropin_floors: Layers,
  ar_ropin_zones: LayoutGrid,
  ar_ropin_pois: MapPin,
  ar_ropin_entries: DoorOpen,
  ar_ropin_users: Users,
};

async function fetchCounts() {
  const results = await Promise.all(
    tableOrder.map(async (key) => {
      const { count, error } = await supabase
        .from(tableConfigs[key].tableName)
        .select("*", { count: "exact", head: true });
      return { key, count: error ? 0 : (count ?? 0) };
    })
  );
  const map: Record<string, number> = {};
  results.forEach((r) => (map[r.key] = r.count));
  return map;
}

async function fetchNavNodesCount() {
  const { count, error } = await supabase
    .from("ar_ropin_navnode")
    .select("*", { count: "exact", head: true });
  return error ? 0 : (count ?? 0);
}

// ─── Shared chart styles ────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    fontSize: 12,
  },
  labelStyle: { color: "hsl(var(--foreground))" },
};

const COLORS = {
  blue: "hsl(221, 83%, 53%)",
  green: "hsl(160, 60%, 45%)",
  amber: "hsl(38, 92%, 50%)",
  rose: "hsl(340, 65%, 55%)",
  purple: "hsl(262, 60%, 55%)",
  cyan: "hsl(200, 70%, 50%)",
};

// ─── Subtle animation ───────────────────────────────────
const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

// ─── Component ──────────────────────────────────────────
export default function Overview() {
  const navigate = useNavigate();

  const { data: counts, isLoading } = useQuery({
    queryKey: ["dashboard-counts"],
    queryFn: fetchCounts,
    refetchInterval: 30000,
  });

  const { data: navNodesCount, isLoading: navLoading } = useQuery({
    queryKey: ["nav-nodes-count"],
    queryFn: fetchNavNodesCount,
    refetchInterval: 30000,
  });

  const chartData = useMemo(() => {
    return tableOrder.map((key) => ({
      name: tableConfigs[key].displayName,
      count: counts?.[key] ?? 0,
    }));
  }, [counts]);

  const totalEntities = useMemo(() => {
    if (!counts) return 0;
    return tableOrder.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
  }, [counts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Facility management & navigation intelligence"
      />

      {/* ─── ROW 1: Core KPIs ──────────────────────────── */}
      <motion.section {...fade} className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Core metrics">
        <StatCard label="Nav Sessions" value={CORE_KPIS.totalNavSessions.toLocaleString()} icon={<Navigation className="w-4 h-4" />} />
        <StatCard label="Success Rate" value={`${CORE_KPIS.navSuccessRate}%`} icon={<CheckCircle className="w-4 h-4" />} />
        <StatCard label="Avg MTTR" value={`${CORE_KPIS.avgMTTR} min`} icon={<Clock className="w-4 h-4" />} />
        <StatCard label="Route Efficiency" value={`${CORE_KPIS.routeEfficiency}%`} icon={<Route className="w-4 h-4" />} />
      </motion.section>

      {/* ─── ROW 2: Secondary stats ────────────────────── */}
      <motion.section {...fade} className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Secondary metrics">
        <StatCard label="Total Entities" value={isLoading ? "—" : totalEntities} />
        <StatCard label="Activity Points" value={navLoading ? "—" : (navNodesCount ?? 0)} icon={<Activity className="w-4 h-4" />} />
        <StatCard label="Technician Productivity" value={`${CORE_KPIS.techProductivity}%`} icon={<Users className="w-4 h-4" />} />
        <StatCard label="Active Users (DAU)" value={USER_ENGAGEMENT.dau} icon={<TrendingUp className="w-4 h-4" />} />
      </motion.section>

      {/* ─── ROW 3: Charts ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Navigation Sessions */}
        <motion.section {...fade} className="section-card" aria-label="Daily navigation">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Daily Navigation Sessions</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={NAVIGATION_USAGE.dailySessions}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="value" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.08} strokeWidth={1.5} name="Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Entity Overview */}
        <motion.section {...fade} className="section-card" aria-label="Entity overview">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Entity Overview</h2>
          <div className="h-[220px]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-body">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" fill={COLORS.purple} radius={[3, 3, 0, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.section>
      </div>

      {/* ─── ROW 4: Completion + Efficiency ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Navigation Completion trend */}
        <motion.section {...fade} className="section-card" aria-label="Completion rate">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Completion Rate Trend</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={NAVIGATION_COMPLETION.dailyCompletion}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[70, 100]} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke={COLORS.green} strokeWidth={1.5} dot={false} name="Completion %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Route Efficiency trend */}
        <motion.section {...fade} className="section-card" aria-label="Route efficiency">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Route Efficiency Trend</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ROUTE_EFFICIENCY.efficiencyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[70, 90]} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke={COLORS.amber} strokeWidth={1.5} dot={{ r: 2, fill: COLORS.amber }} name="Efficiency %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Quick stats column */}
        <motion.section {...fade} className="space-y-3" aria-label="Quick stats">
          <div className="section-card">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Search</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Searches</p>
                <p className="font-semibold text-foreground">{SEARCH_ANALYTICS.totalSearches.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Success Rate</p>
                <p className="font-semibold text-foreground">{SEARCH_ANALYTICS.successRate}%</p>
              </div>
            </div>
          </div>
          <div className="section-card">
            <div className="flex items-center gap-3 mb-2">
              <Box className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Assets</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Most Visited</p>
                <p className="font-semibold text-foreground truncate" title={CORE_KPIS.mostVisitedAsset}>{CORE_KPIS.mostVisitedAsset}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Completion</p>
                <p className="font-semibold text-foreground">{NAVIGATION_COMPLETION.successRate}%</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/analytics")}
            className="section-card w-full text-left flex items-center justify-between group hover:border-foreground/20 transition-colors focus-ring"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">View All Analytics</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </motion.section>
      </div>

      {/* ─── ROW 5: Most Visited Assets + Technician Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.section {...fade} className="section-card" aria-label="Top assets">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Most Visited Assets</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ASSET_NAVIGATION.mostVisited.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={120} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="visits" fill={COLORS.cyan} radius={[0, 3, 3, 0]} name="Visits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section {...fade} className="section-card" aria-label="Technician productivity">
          <h2 className="font-display font-semibold text-sm text-foreground mb-3">Technician Productivity</h2>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TECHNICIAN_ACTIVITY.productivityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[60, 100]} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke={COLORS.rose} strokeWidth={1.5} dot={{ r: 2, fill: COLORS.rose }} name="Productivity %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      {/* ─── ROW 6: Configuration cards ────────────────── */}
      <section aria-label="Configuration">
        <h2 className="font-display font-semibold text-sm text-foreground mb-3">Configuration</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tableOrder.map((key) => {
            const cfg = tableConfigs[key];
            const Icon = iconMap[key];
            const count = counts?.[key];
            const route = routeMap[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(route)}
                className="section-card text-left group hover:border-foreground/20 transition-colors focus-ring"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{cfg.displayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-lg text-foreground">
                    {isLoading ? "—" : count ?? 0}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── ROW 7: User Activity link ─────────────────── */}
      <motion.section {...fade} aria-label="User Activity">
        <button
          type="button"
          onClick={() => navigate("/user-activity")}
          className="w-full section-card text-left flex items-center justify-between group hover:border-foreground/20 transition-colors focus-ring"
        >
          <div className="flex items-center gap-4">
            <Activity className="w-5 h-5 text-muted-foreground" />
            <div>
              <h2 className="font-display font-semibold text-sm text-foreground">User Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {navLoading ? "—" : `${navNodesCount ?? 0} activity points recorded`}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </motion.section>
    </div>
  );
}
