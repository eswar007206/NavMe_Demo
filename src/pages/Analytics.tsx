import { useState } from "react";
import { motion } from "framer-motion";
import {
  LuChartBar as BarChart3,
  LuNavigation as Navigation,
  LuSearch as Search,
  LuCircleCheck as CheckCircle,
  LuClock as Clock,
  LuBox as Box,
  LuUsers as Users,
  LuRoute as Route,
  LuLayoutGrid as LayoutGrid,
  LuLayers as Layers,
  LuBuilding2 as Building2,
  LuGitBranch as GitBranch,
  LuMapPin as MapPin,
  LuScanLine as ScanLine,
  LuQrCode as QrCode,
  LuMap as MapIcon,
  LuLocate as Locate,
  LuGauge as Gauge,
  LuHardDrive as HardDrive,
  LuHeart as Heart,
  LuFlame as Flame,
} from "react-icons/lu";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  NAVIGATION_USAGE,
  SEARCH_ANALYTICS,
  NAVIGATION_COMPLETION,
  MTTR_DATA,
  ASSET_NAVIGATION,
  TECHNICIAN_ACTIVITY,
  ROUTE_EFFICIENCY,
  ZONE_ANALYTICS,
  FLOOR_ANALYTICS,
  BUILDING_ANALYTICS,
  PATHFINDING_ANALYTICS,
  ARRIVAL_ANALYTICS,
  ASSET_DISCOVERY,
  QR_CODE_ANALYTICS,
  MAP_USAGE,
  VPS_ANALYTICS,
  SYSTEM_PERFORMANCE,
  SCAN_DATA,
  USER_ENGAGEMENT,
  HEATMAP_ANALYTICS,
  CORE_KPIS,
  ANALYTICS_CATEGORIES,
  CHART_COLORS,
} from "@/data/analyticsData";

// ─── Shared tooltip style ───────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
  },
  labelStyle: { color: "hsl(var(--foreground))" },
};

// ─── Sidebar icon map ───────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "navigation-usage": <Navigation className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
  completion: <CheckCircle className="w-4 h-4" />,
  mttr: <Clock className="w-4 h-4" />,
  "asset-navigation": <Box className="w-4 h-4" />,
  technician: <Users className="w-4 h-4" />,
  "route-efficiency": <Route className="w-4 h-4" />,
  zone: <LayoutGrid className="w-4 h-4" />,
  floor: <Layers className="w-4 h-4" />,
  building: <Building2 className="w-4 h-4" />,
  pathfinding: <GitBranch className="w-4 h-4" />,
  arrival: <MapPin className="w-4 h-4" />,
  "asset-discovery": <ScanLine className="w-4 h-4" />,
  "qr-code": <QrCode className="w-4 h-4" />,
  "map-usage": <MapIcon className="w-4 h-4" />,
  vps: <Locate className="w-4 h-4" />,
  "system-performance": <Gauge className="w-4 h-4" />,
  "scan-data": <HardDrive className="w-4 h-4" />,
  "user-engagement": <Heart className="w-4 h-4" />,
  heatmap: <Flame className="w-4 h-4" />,
};

// ─── Group categories ───────────────────────────────────
const GROUP_ORDER = ["Navigation", "Assets", "Routes", "Spatial", "System", "Engagement"];

function groupCategories() {
  const groups: Record<string, typeof ANALYTICS_CATEGORIES> = {};
  for (const cat of ANALYTICS_CATEGORIES) {
    if (!groups[cat.group]) groups[cat.group] = [];
    groups[cat.group].push(cat);
  }
  return GROUP_ORDER.map((g) => ({ group: g, items: groups[g] || [] }));
}

const GROUPED_CATEGORIES = groupCategories();

// ─── Animation variants ─────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

// ─── Helper: build stacked bar data for building asset distribution ─
function getBuildingStackedBarData() {
  const types = BUILDING_ANALYTICS.assetDistribution[0]?.byType.map((t) => t.type) ?? [];
  return types.map((type) => {
    const row: Record<string, string | number> = { type };
    for (const b of BUILDING_ANALYTICS.assetDistribution) {
      const found = b.byType.find((t) => t.type === type);
      row[b.name] = found?.count ?? 0;
    }
    return row;
  });
}

// ─── Helper: format path for heatmap ────────────────────
function formatPath(p: { from: string; to: string }) {
  return `${p.from} -> ${p.to}`;
}

// ─── Section content renderers ──────────────────────────
function NavigationUsageSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Sessions" value={NAVIGATION_USAGE.totalSessions.toLocaleString()} />
        <StatCard label="Unique Users" value={NAVIGATION_USAGE.uniqueUsers.toLocaleString()} />
        <StatCard label="Avg Sessions/User" value={NAVIGATION_USAGE.avgSessionsPerUser} />
        <StatCard label="Buildings" value={NAVIGATION_USAGE.perBuilding.length} />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Daily Sessions (30 days)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={NAVIGATION_USAGE.dailySessions}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} name="Sessions" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Sessions per Building</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={NAVIGATION_USAGE.perBuilding}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="sessions" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Sessions per Floor</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={NAVIGATION_USAGE.perFloor}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="sessions" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Peak Hours Distribution</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={NAVIGATION_USAGE.peakHours}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="sessions" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.15} strokeWidth={2} name="Sessions" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function SearchAnalyticsSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Searches" value={SEARCH_ANALYTICS.totalSearches.toLocaleString()} />
        <StatCard label="Conversion Rate" value={`${SEARCH_ANALYTICS.conversionRate}%`} />
        <StatCard label="Success Rate" value={`${SEARCH_ANALYTICS.successRate}%`} />
        <StatCard label="Failed Attempts" value={SEARCH_ANALYTICS.failedAttempts.toLocaleString()} />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Top Assets Searched</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SEARCH_ANALYTICS.topAssets} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={160} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="searches" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} name="Searches" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Success vs Failed</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Successful", value: SEARCH_ANALYTICS.totalSearches - SEARCH_ANALYTICS.failedAttempts },
                  { name: "Failed", value: SEARCH_ANALYTICS.failedAttempts },
                ]}
                cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
              >
                <Cell fill={CHART_COLORS[1]} />
                <Cell fill={CHART_COLORS[3]} />
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Searches by Zone</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={SEARCH_ANALYTICS.topZones}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="searches" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} name="Searches" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function NavigationCompletionSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Started" value={NAVIGATION_COMPLETION.started.toLocaleString()} />
        <StatCard label="Completed" value={NAVIGATION_COMPLETION.completed.toLocaleString()} />
        <StatCard label="Abandoned" value={NAVIGATION_COMPLETION.abandoned.toLocaleString()} />
        <StatCard label="Success Rate" value={`${NAVIGATION_COMPLETION.successRate}%`} />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Daily Completion Rate (%)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={NAVIGATION_COMPLETION.dailyCompletion}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} domain={[70, 100]} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} name="Completion Rate %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Completion by Destination Type</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={NAVIGATION_COMPLETION.byDestinationType} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="completed" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} name="Completed" />
            <Bar dataKey="started" fill={CHART_COLORS[5]} radius={[0, 4, 4, 0]} name="Started" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function MTTRSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Avg MTTR" value={`${MTTR_DATA.avgMTTR} min`} />
        <StatCard label="Fastest" value={`${MTTR_DATA.fastestResponse} min`} />
        <StatCard label="Slowest" value={`${MTTR_DATA.slowestResponse} min`} />
        <StatCard label="Technicians" value={MTTR_DATA.byTechnician.length} />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">MTTR by Asset Type (min)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={MTTR_DATA.byAssetType}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="mttr" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} name="MTTR (min)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">MTTR by Technician (min)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MTTR_DATA.byTechnician} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="mttr" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} name="MTTR (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">MTTR Improvement Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MTTR_DATA.improvementOverWeeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[4] }} name="MTTR (min)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function AssetNavigationSection() {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Most Visited Assets</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ASSET_NAVIGATION.mostVisited}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="visits" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Visits" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Daily Asset Visits</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ASSET_NAVIGATION.dailyVisits}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} name="Visits" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Visits by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={ASSET_NAVIGATION.byCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="visits" nameKey="name">
                {ASSET_NAVIGATION.byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function TechnicianActivitySection() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {TECHNICIAN_ACTIVITY.sessionsPerTech.slice(0, 6).map((tech) => (
          <div key={tech.name} className="section-card flex flex-col gap-1">
            <p className="font-medium text-sm text-foreground truncate">{tech.name}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-caption text-muted-foreground">
              <span>Sessions: <strong className="text-foreground">{tech.sessions}</strong></span>
              <span>Tasks: <strong className="text-foreground">{tech.tasksCompleted}</strong></span>
              <span>Avg Time: <strong className="text-foreground">{tech.avgTime} min</strong></span>
              <span>Idle: <strong className="text-foreground">{tech.idleTime}%</strong></span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Productivity Trend (Weekly)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={TECHNICIAN_ACTIVITY.productivityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[4] }} name="Productivity %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Sessions per Technician</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={TECHNICIAN_ACTIVITY.sessionsPerTech} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="sessions" fill={CHART_COLORS[5]} radius={[0, 4, 4, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function RouteEfficiencySection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Avg Distance" value={`${ROUTE_EFFICIENCY.avgDistance}m`} />
        <StatCard label="Avg Efficiency" value={`${ROUTE_EFFICIENCY.avgEfficiency}%`} />
        <StatCard label="Deviation Rate" value={`${ROUTE_EFFICIENCY.deviationRate}%`} />
        <StatCard label="Top Routes" value={ROUTE_EFFICIENCY.mostUsedRoutes.length} />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Shortest vs Actual Distance (m)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ROUTE_EFFICIENCY.shortestVsActual}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Bar dataKey="shortest" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} name="Shortest" />
            <Bar dataKey="actual" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} name="Actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Efficiency Trend (Weekly)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ROUTE_EFFICIENCY.efficiencyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[70, 90]} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[0] }} name="Efficiency %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Most Used Routes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ROUTE_EFFICIENCY.mostUsedRoutes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={150} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill={CHART_COLORS[6]} radius={[0, 4, 4, 0]} name="Usage Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function ZoneAnalyticsSection() {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Zone Entry Count</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ZONE_ANALYTICS.mostVisited}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="entries" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Entries" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Zone Congestion (Peak %)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ZONE_ANALYTICS.congestion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="peak" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} name="Peak %" />
              <Bar dataKey="average" fill={CHART_COLORS[5]} radius={[0, 4, 4, 0]} name="Average %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Navigation Success Rate by Zone</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ZONE_ANALYTICS.successRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} domain={[80, 100]} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="rate" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} name="Success Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function FloorAnalyticsSection() {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Sessions per Floor</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={FLOOR_ANALYTICS.sessionsPerFloor}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="sessions" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Sessions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Traffic Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={FLOOR_ANALYTICS.trafficDistribution}
                cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3}
                dataKey="percentage" nameKey="name"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {FLOOR_ANALYTICS.trafficDistribution.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Asset Usage Rate by Floor (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={FLOOR_ANALYTICS.assetUsageRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[60, 100]} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="rate" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} name="Usage Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function BuildingAnalyticsSection() {
  const buildingStackedData = getBuildingStackedBarData();
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {BUILDING_ANALYTICS.sessionsPerBuilding.map((b) => (
          <StatCard key={b.name} label={b.name} value={b.sessions.toLocaleString()} description={`Avg dist: ${b.avgDistance}m`} />
        ))}
        <StatCard label="Total Assets (A)" value={BUILDING_ANALYTICS.assetDistribution[0]?.assets ?? 0} />
        <StatCard label="Total Assets (B)" value={BUILDING_ANALYTICS.assetDistribution[1]?.assets ?? 0} />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Sessions per Building</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={BUILDING_ANALYTICS.sessionsPerBuilding}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="sessions" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} name="Sessions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Asset Type Distribution by Building</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={buildingStackedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            {BUILDING_ANALYTICS.assetDistribution.map((b, i) => (
              <Bar
                key={b.name}
                dataKey={b.name}
                stackId="building"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={i === BUILDING_ANALYTICS.assetDistribution.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                name={b.name}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function PathfindingSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Avg Calc Time" value={`${PATHFINDING_ANALYTICS.avgCalcTime}s`} />
        <StatCard label="Errors" value={PATHFINDING_ANALYTICS.errors} />
        <StatCard label="Success Rate" value={`${PATHFINDING_ANALYTICS.successRate}%`} />
        <StatCard label="Re-routings" value={PATHFINDING_ANALYTICS.reroutingCount.toLocaleString()} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Errors by Type</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={PATHFINDING_ANALYTICS.errorsByType} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="count" nameKey="name">
                {PATHFINDING_ANALYTICS.errorsByType.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Calc Time Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={PATHFINDING_ANALYTICS.calcTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} name="Calc Time (s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function ArrivalSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Successful Arrivals" value={ARRIVAL_ANALYTICS.successfulArrivals.toLocaleString()} />
        <StatCard label="Accuracy" value={`${ARRIVAL_ANALYTICS.accuracy}%`} />
        <StatCard label="Avg Time to Reach" value={`${ARRIVAL_ANALYTICS.avgTimeToReach} min`} />
        <StatCard label="Detection Failures" value={ARRIVAL_ANALYTICS.detectionFailures} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Arrivals by Destination Type</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={ARRIVAL_ANALYTICS.byDestinationType} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="arrivals" nameKey="name">
                {ARRIVAL_ANALYTICS.byDestinationType.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Accuracy Trend (Weekly)</h3>
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={ARRIVAL_ANALYTICS.accuracyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[88, 98]} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[1] }} name="Accuracy %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function AssetDiscoverySection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Discoveries" value={ASSET_DISCOVERY.totalDiscoveries.toLocaleString()} />
        <StatCard label="Avg Discovery Time" value={`${ASSET_DISCOVERY.avgDiscoveryTime}s`} />
        <StatCard label="With QR" value={ASSET_DISCOVERY.withQR.toLocaleString()} />
        <StatCard label="Failure Rate" value={`${ASSET_DISCOVERY.failureRate}%`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Discovery by Method</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={ASSET_DISCOVERY.byMethod} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                {ASSET_DISCOVERY.byMethod.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Discovery Time Trend (Weekly)</h3>
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={ASSET_DISCOVERY.discoveryTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[6]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[6] }} name="Discovery Time (s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function QRCodeSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Scans" value={QR_CODE_ANALYTICS.totalScans.toLocaleString()} />
        <StatCard label="Success Rate" value={`${QR_CODE_ANALYTICS.successRate}%`} />
        <StatCard label="Failures" value={QR_CODE_ANALYTICS.failures} />
        <StatCard label="Technicians" value={QR_CODE_ANALYTICS.scansPerTech.length} />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Scans per Asset Type</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={QR_CODE_ANALYTICS.scansPerAsset}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="scans" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} name="Scans" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">QR Scan vs Manual Navigation</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={QR_CODE_ANALYTICS.qrVsNavigation} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" nameKey="name">
                <Cell fill={CHART_COLORS[0]} />
                <Cell fill={CHART_COLORS[2]} />
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Daily Scans (30 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={QR_CODE_ANALYTICS.dailyScans}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[4]} strokeWidth={2} dot={false} name="Scans" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function MapUsageSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Views" value={MAP_USAGE.totalViews.toLocaleString()} />
        <StatCard label="Avg Views/User" value={MAP_USAGE.avgViewsPerUser} />
        <StatCard label="Zoom Events" value={MAP_USAGE.interactions.zoom.toLocaleString()} />
        <StatCard label="Floor Switches" value={MAP_USAGE.interactions.floorSwitch.toLocaleString()} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Interaction Breakdown</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={MAP_USAGE.interactionBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                {MAP_USAGE.interactionBreakdown.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Daily Map Views (30 days)</h3>
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={MAP_USAGE.dailyViews}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[5]} strokeWidth={2} dot={false} name="Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function VPSSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Detection Success" value={`${VPS_ANALYTICS.detectionSuccess}%`} />
        <StatCard label="Drift Rate" value={`${VPS_ANALYTICS.driftRate}%`} />
        <StatCard label="Avg Accuracy" value={`${VPS_ANALYTICS.avgAccuracy}m`} />
        <StatCard label="Recovery Time" value={`${VPS_ANALYTICS.recoveryTime}s`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Failure Types</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={VPS_ANALYTICS.failuresByType} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="count" nameKey="name">
                {VPS_ANALYTICS.failuresByType.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Accuracy Trend (Weekly, meters)</h3>
          <ResponsiveContainer width="100%" height={270}>
            <LineChart data={VPS_ANALYTICS.accuracyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[7]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[7] }} name="Accuracy (m)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function SystemPerformanceSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <StatCard label="Map Load" value={`${SYSTEM_PERFORMANCE.mapLoadTime}s`} />
        <StatCard label="Nav Start" value={`${SYSTEM_PERFORMANCE.navStartLatency}s`} />
        <StatCard label="Calc Time" value={`${SYSTEM_PERFORMANCE.calcTime}s`} />
        <StatCard label="E57 Process" value={`${SYSTEM_PERFORMANCE.e57ProcessingTime} min`} />
        <StatCard label="Map Stitch" value={`${SYSTEM_PERFORMANCE.mapStitchTime} min`} />
        <StatCard label="Upload" value={`${SYSTEM_PERFORMANCE.uploadTime} min`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Map Load Time Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={SYSTEM_PERFORMANCE.loadTimeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} name="Load Time (s)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Performance Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={SYSTEM_PERFORMANCE.performanceBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                {...tooltipStyle}
                formatter={(val: number, _name: string, props: { payload: { unit: string } }) =>
                  [`${val} ${props.payload.unit}`, "Duration"]
                }
              />
              <Bar dataKey="value" fill={CHART_COLORS[8]} radius={[4, 4, 0, 0]} name="Duration">
                {SYSTEM_PERFORMANCE.performanceBreakdown.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function ScanDataSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="E57 Processed" value={SCAN_DATA.e57Processed} />
        <StatCard label="Coverage" value={`${SCAN_DATA.coveragePercent}%`} />
        <StatCard label="Missing Areas" value={SCAN_DATA.missingAreas.length} />
        <StatCard label="Total Scans" value={SCAN_DATA.scanDensity.reduce((a, d) => a + d.scans, 0)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Scan Density per Floor (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={SCAN_DATA.scanDensity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[80, 100]} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="density" fill={CHART_COLORS[7]} radius={[4, 4, 0, 0]} name="Density %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Scan Update Frequency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={SCAN_DATA.updateFrequency} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="scans" nameKey="name">
                {SCAN_DATA.updateFrequency.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Missing Coverage Areas</h3>
        <div className="flex flex-wrap gap-2">
          {SCAN_DATA.missingAreas.map((area) => (
            <span key={area} className="px-3 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              {area}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

function UserEngagementSection() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="DAU" value={USER_ENGAGEMENT.dau} />
        <StatCard label="WAU" value={USER_ENGAGEMENT.wau} />
        <StatCard label="MAU" value={USER_ENGAGEMENT.mau} />
        <StatCard label="Avg Session" value={`${USER_ENGAGEMENT.avgSessionDuration} min`} />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Daily Active Users (30 days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={USER_ENGAGEMENT.dauTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={5} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} name="DAU" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Feature Usage Distribution (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={USER_ENGAGEMENT.featureUsage} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                {USER_ENGAGEMENT.featureUsage.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg Session Duration Trend (Weekly)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={USER_ENGAGEMENT.sessionDurationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS[3] }} name="Duration (min)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function HeatmapSection() {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Zone Congestion Intensity</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={HEATMAP_ANALYTICS.zoneCongestion}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="intensity" fill={CHART_COLORS[9]} radius={[4, 4, 0, 0]} name="Intensity">
              {HEATMAP_ANALYTICS.zoneCongestion.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.intensity >= 0.7 ? CHART_COLORS[9] : entry.intensity >= 0.5 ? CHART_COLORS[2] : CHART_COLORS[1]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Path Frequency</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={HEATMAP_ANALYTICS.pathFrequency.map((p) => ({ ...p, name: formatPath(p) }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={155} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="frequency" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} name="Frequency" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Peak Time Intensity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={HEATMAP_ANALYTICS.peakTimes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="intensity" radius={[4, 4, 0, 0]} name="Intensity">
                {HEATMAP_ANALYTICS.peakTimes.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.intensity >= 0.85 ? CHART_COLORS[9] : entry.intensity >= 0.7 ? CHART_COLORS[2] : CHART_COLORS[1]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

// ─── Section renderer map ───────────────────────────────
const SECTION_RENDERERS: Record<string, () => React.ReactNode> = {
  "navigation-usage": () => <NavigationUsageSection />,
  search: () => <SearchAnalyticsSection />,
  completion: () => <NavigationCompletionSection />,
  mttr: () => <MTTRSection />,
  "asset-navigation": () => <AssetNavigationSection />,
  technician: () => <TechnicianActivitySection />,
  "route-efficiency": () => <RouteEfficiencySection />,
  zone: () => <ZoneAnalyticsSection />,
  floor: () => <FloorAnalyticsSection />,
  building: () => <BuildingAnalyticsSection />,
  pathfinding: () => <PathfindingSection />,
  arrival: () => <ArrivalSection />,
  "asset-discovery": () => <AssetDiscoverySection />,
  "qr-code": () => <QRCodeSection />,
  "map-usage": () => <MapUsageSection />,
  vps: () => <VPSSection />,
  "system-performance": () => <SystemPerformanceSection />,
  "scan-data": () => <ScanDataSection />,
  "user-engagement": () => <UserEngagementSection />,
  heatmap: () => <HeatmapSection />,
};

// ─── Section title map ──────────────────────────────────
const SECTION_TITLES: Record<string, string> = {
  "navigation-usage": "Navigation Usage",
  search: "Search Analytics",
  completion: "Navigation Completion",
  mttr: "Mean Time To Reach (MTTR)",
  "asset-navigation": "Asset Navigation",
  technician: "Technician Activity",
  "route-efficiency": "Route Efficiency",
  zone: "Zone Analytics",
  floor: "Floor Analytics",
  building: "Building Analytics",
  pathfinding: "Pathfinding Analytics",
  arrival: "Arrival Analytics",
  "asset-discovery": "Asset Discovery",
  "qr-code": "QR Code Analytics",
  "map-usage": "Map Usage",
  vps: "VPS / Localization",
  "system-performance": "System Performance",
  "scan-data": "Scan Data",
  "user-engagement": "User Engagement",
  heatmap: "Heatmap Analytics",
};

// ─── Group icons ────────────────────────────────────────
const GROUP_ICONS: Record<string, React.ReactNode> = {
  Navigation: <Navigation className="w-3.5 h-3.5" />,
  Assets: <Box className="w-3.5 h-3.5" />,
  Routes: <Route className="w-3.5 h-3.5" />,
  Spatial: <Building2 className="w-3.5 h-3.5" />,
  System: <Gauge className="w-3.5 h-3.5" />,
  Engagement: <Heart className="w-3.5 h-3.5" />,
};

// ─── Main Component ─────────────────────────────────────
export default function Analytics() {
  const [activeSection, setActiveSection] = useState(ANALYTICS_CATEGORIES[0].id);

  const activeLabel = SECTION_TITLES[activeSection] ?? activeSection;
  const renderContent = SECTION_RENDERERS[activeSection];

  // Find which group the active section belongs to
  const activeGroup = ANALYTICS_CATEGORIES.find((c) => c.id === activeSection)?.group ?? "";

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-5rem)]">
      {/* ─── FIXED TOP: Header + KPIs ──────────────────── */}
      <div className="shrink-0">
        <PageHeader
          title="Analytics"
          description="Comprehensive analytics dashboard with 20 metric categories"
          icon={<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />}
        />

        <motion.div {...fadeUp} className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Total Nav Sessions"
              value={CORE_KPIS.totalNavSessions.toLocaleString()}
              icon={<Navigation />}
            />
            <StatCard
              label="Nav Success Rate"
              value={`${CORE_KPIS.navSuccessRate}%`}
              icon={<CheckCircle />}
            />
            <StatCard
              label="Avg MTTR"
              value={`${CORE_KPIS.avgMTTR} min`}
              icon={<Clock />}
            />
            <StatCard
              label="Route Efficiency"
              value={`${CORE_KPIS.routeEfficiency}%`}
              icon={<Route />}
            />
          </div>
        </motion.div>

        {/* ─── MOBILE TAB BAR (sticky) ───────────────────── */}
        <div className="lg:hidden bg-background/95 backdrop-blur-sm -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 border-b border-border/50">
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-1.5 min-w-max">
              {ANALYTICS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveSection(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeSection === cat.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {CATEGORY_ICONS[cat.id]}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BODY: Sidebar + Scrollable Content ──────────── */}
      <div className="flex gap-0 flex-1 min-h-0 mt-2 lg:mt-0">
        {/* ─── LEFT SIDEBAR (fixed, never scrolls with content) */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-border/50 pr-3">
          <div className="overflow-y-auto flex-1 pb-4 space-y-3 scrollbar-glass">
            {GROUPED_CATEGORIES.map(({ group, items }) => (
              <div key={group}>
                {/* Group header */}
                <div
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider mb-1 ${
                    activeGroup === group
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {GROUP_ICONS[group]}
                  <span>{group}</span>
                  <span className="ml-auto text-[10px] font-normal opacity-60">{items.length}</span>
                </div>
                {/* Category items */}
                <ul className="space-y-0.5 ml-1">
                  {items.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => setActiveSection(cat.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all focus-ring ${
                          activeSection === cat.id
                            ? "bg-primary/10 text-primary font-medium shadow-sm shadow-primary/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        <span className={`shrink-0 ${activeSection === cat.id ? "text-primary" : "text-muted-foreground/70"}`}>
                          {CATEGORY_ICONS[cat.id]}
                        </span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* ─── MAIN CONTENT (this is the ONLY scrollable area) */}
        <main className="flex-1 min-w-0 overflow-y-auto lg:pl-6 pb-8 scrollbar-glass">
          <motion.section
            key={activeSection}
            className="section-card"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className="font-display font-semibold text-section-title text-foreground mb-4">
              {activeLabel}
            </h2>
            {renderContent?.()}
          </motion.section>
        </main>
      </div>
    </div>
  );
}
