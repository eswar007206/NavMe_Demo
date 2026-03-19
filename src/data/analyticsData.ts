// ─── Shared constants ─────────────────────────────────

export const TECHNICIANS = [
  "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Sneha Reddy", "Vikram Singh",
  "Anjali Gupta", "Rohit Verma", "Kavita Nair", "Suresh Menon", "Deepa Joshi",
];

export const BUILDINGS = ["NavMe Demo Building A", "NavMe Demo Building B"];

export const FLOOR_NAMES = ["Ground Floor", "First Floor"];

export const ZONES = [
  "BIM Production Zone", "VR/AR Lab", "Training Wing", "Admin Wing",
  "Server Room", "Cafeteria", "Lobby", "Conference Zone",
];

export const ASSET_TYPES = [
  "AC Unit", "UPS System", "Elevator", "Fire Panel", "CCTV Camera",
  "Access Panel", "Server Rack", "Projector", "AHU",
];

export const ROOMS = [
  "BIM Studio 1", "BIM Studio 2", "VR Demo Room", "Training Room A",
  "Training Room B", "Board Room", "Server Room 1", "Server Room 2",
  "CEO Office", "CTO Office", "HR Office", "Finance Office",
  "Cafeteria Main", "Pantry", "Reception", "Visitor Lounge",
];

// Chart color palette — vibrant, distinct colors for charts
export const CHART_COLORS = [
  "hsl(221, 83%, 53%)", "hsl(160, 60%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(340, 65%, 55%)", "hsl(262, 60%, 55%)", "hsl(200, 70%, 50%)",
  "hsl(25, 80%, 55%)", "hsl(140, 50%, 45%)", "hsl(280, 55%, 50%)",
  "hsl(0, 65%, 50%)",
];

// Helper: generate daily data for last 30 days
function dailyData(baseFn: (i: number) => number) {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: baseFn(i),
    };
  });
}

// Helper: generate weekly data for 12 weeks
function weeklyData(baseFn: (i: number) => number) {
  return Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    value: baseFn(i),
  }));
}

// Helper: generate monthly for 6 months
function monthlyData(baseFn: (i: number) => number) {
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  return months.map((m, i) => ({ month: m, value: baseFn(i) }));
}

// Helper: hourly distribution (0-23)
function hourlyData(peakHour: number) {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    sessions: Math.round(
      40 * Math.exp(-0.5 * ((h - peakHour) / 3) ** 2) +
      (h >= 9 && h <= 18 ? 15 : 2) +
      Math.random() * 8
    ),
  }));
}

// ─── 1. NAVIGATION_USAGE ─────────────────────────────

export const NAVIGATION_USAGE = {
  totalSessions: 14_287,
  dailySessions: dailyData((i) => 380 + Math.round(Math.sin(i / 4) * 60 + Math.random() * 50)),
  weeklySessions: weeklyData((i) => 2800 + Math.round(Math.sin(i / 3) * 400 + Math.random() * 200)),
  monthlySessions: monthlyData((i) => 11200 + Math.round(i * 450 + Math.random() * 800)),
  uniqueUsers: 347,
  avgSessionsPerUser: 41.2,
  perBuilding: [
    { name: "NavMe Demo Building A", sessions: 8412 },
    { name: "NavMe Demo Building B", sessions: 5875 },
  ],
  perFloor: FLOOR_NAMES.map((f, i) => ({ name: f, sessions: [4120, 3890][i] })),
  perZone: ZONES.map((z, i) => ({
    name: z,
    sessions: [3240, 1870, 2410, 1650, 890, 1820, 1340, 1067][i],
  })),
  peakHours: hourlyData(11),
};

// ─── 2. SEARCH_ANALYTICS ─────────────────────────────

export const SEARCH_ANALYTICS = {
  totalSearches: 9_814,
  conversionRate: 78.3,
  successRate: 91.7,
  failedAttempts: 814,
  topAssets: [
    { name: "AC Unit - BIM Studio 1", searches: 342 },
    { name: "UPS - Server Room 1", searches: 298 },
    { name: "Fire Panel - Lobby", searches: 267 },
    { name: "AHU - Training Wing", searches: 234 },
    { name: "CCTV - Conference Zone", searches: 212 },
    { name: "Elevator - Tower A", searches: 198 },
    { name: "Server Rack - SR2", searches: 187 },
    { name: "Projector - VR Lab", searches: 176 },
  ],
  topRooms: ROOMS.slice(0, 8).map((r, i) => ({
    name: r,
    searches: 420 - i * 38 + Math.round(Math.random() * 20),
  })),
  topFloors: FLOOR_NAMES.map((f, i) => ({
    name: f,
    searches: [3210, 2870][i],
  })),
  topZones: ZONES.map((z, i) => ({
    name: z,
    searches: [2180, 1560, 1420, 1190, 780, 1210, 890, 584][i],
  })),
};

// ─── 3. NAVIGATION_COMPLETION ────────────────────────

export const NAVIGATION_COMPLETION = {
  started: 14_287,
  completed: 12_643,
  abandoned: 1_644,
  successRate: 88.5,
  avgDuration: 4.2, // minutes
  avgDistance: 127.8, // meters
  avgTimePerDestination: 3.8,
  destinationAccuracy: 94.2,
  dailyCompletion: dailyData((i) => 85 + Math.round(Math.sin(i / 5) * 5 + Math.random() * 4)),
  byDestinationType: [
    { name: "Assets", started: 5840, completed: 5210, rate: 89.2 },
    { name: "Rooms", started: 4120, completed: 3680, rate: 89.3 },
    { name: "Zones", started: 2870, completed: 2490, rate: 86.8 },
    { name: "POIs", started: 1457, completed: 1263, rate: 86.7 },
  ],
};

// ─── 4. MTTR_DATA ────────────────────────────────────

export const MTTR_DATA = {
  avgMTTR: 4.7, // minutes
  byAssetType: ASSET_TYPES.map((a, i) => ({
    name: a,
    mttr: [3.2, 5.1, 6.8, 4.4, 3.8, 4.1, 5.9, 3.5, 7.2][i],
  })),
  byBuilding: BUILDINGS.map((b, i) => ({
    name: b,
    mttr: [4.3, 5.1][i],
  })),
  byFloor: FLOOR_NAMES.map((f, i) => ({
    name: f,
    mttr: [3.9, 4.5][i],
  })),
  byTechnician: TECHNICIANS.map((t, i) => ({
    name: t,
    mttr: [3.1, 4.2, 3.8, 5.1, 4.5, 3.9, 4.8, 5.3, 4.1, 4.6][i],
    tasks: [142, 128, 134, 98, 119, 131, 105, 87, 122, 108][i],
  })),
  improvementOverWeeks: weeklyData((i) => +(5.8 - i * 0.09 + Math.random() * 0.3).toFixed(1)),
  fastestResponse: 0.8,
  slowestResponse: 14.2,
};

// ─── 5. ASSET_NAVIGATION ────────────────────────────

export const ASSET_NAVIGATION = {
  mostVisited: [
    { name: "AC Unit - BIM Studio 1", visits: 487, category: "AC Unit" },
    { name: "UPS - Server Room 1", visits: 412, category: "UPS System" },
    { name: "Fire Panel - Lobby", visits: 378, category: "Fire Panel" },
    { name: "AHU - Training Wing", visits: 356, category: "AHU" },
    { name: "Server Rack 1 - SR1", visits: 334, category: "Server Rack" },
    { name: "Elevator A", visits: 312, category: "Elevator" },
    { name: "CCTV - Main Entrance", visits: 289, category: "CCTV Camera" },
    { name: "Projector - VR Lab", visits: 267, category: "Projector" },
  ],
  leastVisited: [
    { name: "Access Panel - Utility 3", visits: 12, category: "Access Panel" },
    { name: "Fire Panel - Parking B2", visits: 18, category: "Fire Panel" },
    { name: "CCTV - Stairwell 4", visits: 23, category: "CCTV Camera" },
    { name: "AC Unit - Storage", visits: 28, category: "AC Unit" },
  ],
  byCategory: ASSET_TYPES.map((a, i) => ({
    name: a,
    visits: [2340, 1890, 1120, 1560, 980, 670, 1430, 540, 1210][i],
    completionRate: [91, 88, 94, 87, 92, 85, 89, 93, 86][i],
  })),
  dailyVisits: dailyData((i) => 140 + Math.round(Math.sin(i / 3) * 30 + Math.random() * 25)),
  weeklyVisits: weeklyData((i) => 1050 + Math.round(Math.sin(i / 4) * 150 + Math.random() * 80)),
  monthlyVisits: monthlyData((i) => 4200 + Math.round(i * 180 + Math.random() * 300)),
};

// ─── 6. TECHNICIAN_ACTIVITY ─────────────────────────

export const TECHNICIAN_ACTIVITY = {
  activePerDay: dailyData((i) => 6 + Math.round(Math.random() * 4)),
  sessionsPerTech: TECHNICIANS.map((t, i) => ({
    name: t,
    sessions: [186, 172, 168, 134, 158, 164, 142, 112, 156, 138][i],
    avgDistance: [1240, 1180, 1320, 980, 1150, 1280, 1060, 870, 1190, 1020][i],
    avgTime: [38, 42, 35, 48, 40, 36, 44, 52, 39, 45][i], // minutes/day
    tasksCompleted: [142, 128, 134, 98, 119, 131, 105, 87, 122, 108][i],
    idleTime: [12, 18, 10, 24, 15, 11, 20, 28, 14, 19][i], // % of shift
  })),
  productivityTrend: weeklyData((i) => 78 + Math.round(i * 1.2 + Math.random() * 4)),
};

// ─── 7. ROUTE_EFFICIENCY ────────────────────────────

export const ROUTE_EFFICIENCY = {
  avgDistance: 127.8,
  avgEfficiency: 82.4,
  deviationRate: 17.6,
  shortestVsActual: [
    { name: "Lobby \u2192 Server Room", shortest: 45, actual: 52 },
    { name: "Cafeteria \u2192 BIM Studio", shortest: 78, actual: 94 },
    { name: "Reception \u2192 VR Lab", shortest: 62, actual: 71 },
    { name: "Admin \u2192 Training Wing", shortest: 38, actual: 48 },
    { name: "Conference \u2192 Server Room", shortest: 91, actual: 112 },
    { name: "Lobby \u2192 Cafeteria", shortest: 34, actual: 38 },
  ],
  mostUsedRoutes: [
    { name: "Lobby \u2192 BIM Production", count: 1240 },
    { name: "Cafeteria \u2192 Admin Wing", count: 980 },
    { name: "Lobby \u2192 Training Wing", count: 870 },
    { name: "Server Room \u2192 BIM Zone", count: 760 },
    { name: "Conference \u2192 VR Lab", count: 650 },
  ],
  congestionAreas: ZONES.map((z, i) => ({
    name: z,
    congestion: [78, 45, 62, 34, 23, 56, 67, 51][i],
  })),
  efficiencyTrend: weeklyData((i) => +(78 + i * 0.4 + Math.random() * 2).toFixed(1)),
};

// ─── 8. ZONE_ANALYTICS ──────────────────────────────

export const ZONE_ANALYTICS = {
  mostVisited: ZONES.map((z, i) => ({
    name: z,
    entries: [4870, 2340, 3120, 2180, 1090, 2640, 3410, 1560][i],
    avgTime: [42, 28, 35, 22, 18, 31, 8, 24][i], // minutes
  })),
  restrictedAttempts: [
    { name: "Server Room", attempts: 47, blocked: 43 },
    { name: "CEO Office", attempts: 12, blocked: 12 },
    { name: "VR/AR Lab", attempts: 23, blocked: 18 },
  ],
  congestion: ZONES.map((z, i) => ({
    name: z,
    peak: [78, 45, 62, 34, 23, 56, 67, 51][i],
    average: [52, 28, 41, 21, 15, 38, 42, 33][i],
  })),
  successRate: ZONES.map((z, i) => ({
    name: z,
    rate: [92, 89, 91, 88, 95, 87, 93, 86][i],
  })),
};

// ─── 9. FLOOR_ANALYTICS ─────────────────────────────

export const FLOOR_ANALYTICS = {
  sessionsPerFloor: FLOOR_NAMES.map((f, i) => ({
    name: f,
    sessions: [4120, 3890][i],
    avgTimeSpent: [35, 42][i], // minutes
  })),
  trafficDistribution: FLOOR_NAMES.map((f, i) => ({
    name: f,
    percentage: [54, 46][i],
  })),
  assetUsageRate: FLOOR_NAMES.map((f, i) => ({
    name: f,
    rate: [87, 82][i],
  })),
  hourlyTraffic: FLOOR_NAMES.map((f) => ({
    floor: f,
    data: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      traffic: Math.round(
        20 * Math.exp(-0.5 * ((h - 11) / 3) ** 2) +
        (h >= 9 && h <= 18 ? 10 : 1) +
        Math.random() * 5
      ),
    })),
  })),
};

// ─── 10. BUILDING_ANALYTICS ─────────────────────────

export const BUILDING_ANALYTICS = {
  sessionsPerBuilding: BUILDINGS.map((b, i) => ({
    name: b,
    sessions: [8412, 5875][i],
    avgDistance: [118, 142][i],
  })),
  trafficByHour: BUILDINGS.map((b) => ({
    building: b,
    data: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      traffic: Math.round(
        30 * Math.exp(-0.5 * ((h - 11) / 3) ** 2) +
        (h >= 9 && h <= 18 ? 12 : 2) +
        Math.random() * 6
      ),
    })),
  })),
  assetDistribution: BUILDINGS.map((b, i) => ({
    name: b,
    assets: [312, 248][i],
    byType: ASSET_TYPES.map((a, j) => ({
      type: a,
      count: Math.round(([35, 22, 4, 18, 42, 28, 16, 12, 8][j]) * (i === 0 ? 1.2 : 0.8)),
    })),
  })),
};

// ─── 11. PATHFINDING_ANALYTICS ──────────────────────

export const PATHFINDING_ANALYTICS = {
  avgCalcTime: 0.34, // seconds
  reroutingCount: 1_243,
  errors: 187,
  successRate: 98.7,
  avgPathLength: 127.8, // meters
  calcTimeTrend: dailyData((i) => +(0.3 + Math.random() * 0.15).toFixed(2)),
  errorsByType: [
    { name: "Path not found", count: 78 },
    { name: "Timeout", count: 42 },
    { name: "Invalid destination", count: 34 },
    { name: "Map data error", count: 21 },
    { name: "Network error", count: 12 },
  ],
};

// ─── 12. ARRIVAL_ANALYTICS ──────────────────────────

export const ARRIVAL_ANALYTICS = {
  successfulArrivals: 12_643,
  accuracy: 94.2,
  avgTimeToReach: 4.2, // minutes
  radiusDetectionRate: 96.8,
  detectionFailures: 412,
  accuracyTrend: weeklyData((i) => +(91 + i * 0.3 + Math.random() * 1.5).toFixed(1)),
  byDestinationType: [
    { name: "Asset", arrivals: 5210, accuracy: 95.1 },
    { name: "Room", arrivals: 3680, accuracy: 93.8 },
    { name: "Zone", arrivals: 2490, accuracy: 92.4 },
    { name: "POI", arrivals: 1263, accuracy: 94.7 },
  ],
};

// ─── 13. ASSET_DISCOVERY ────────────────────────────

export const ASSET_DISCOVERY = {
  totalDiscoveries: 8_934,
  avgDiscoveryTime: 12.4, // seconds
  withQR: 6_247,
  withoutQR: 2_687,
  failureRate: 3.8,
  byMethod: [
    { name: "QR Code Scan", value: 6247 },
    { name: "Search & Navigate", value: 1834 },
    { name: "Map Browse", value: 853 },
  ],
  discoveryTimeTrend: weeklyData((i) => +(14.2 - i * 0.15 + Math.random() * 1).toFixed(1)),
};

// ─── 14. QR_CODE_ANALYTICS ──────────────────────────

export const QR_CODE_ANALYTICS = {
  totalScans: 6_247,
  successRate: 94.6,
  failures: 337,
  scansPerAsset: ASSET_TYPES.map((a, i) => ({
    name: a,
    scans: [1120, 890, 340, 780, 620, 410, 890, 320, 540][i],
  })),
  scansPerTech: TECHNICIANS.map((t, i) => ({
    name: t,
    scans: [834, 712, 768, 542, 648, 694, 578, 467, 658, 546][i],
  })),
  qrVsNavigation: [
    { name: "QR Scan", value: 6247 },
    { name: "Manual Navigation", value: 8040 },
  ],
  dailyScans: dailyData((i) => 160 + Math.round(Math.sin(i / 4) * 30 + Math.random() * 20)),
};

// ─── 15. MAP_USAGE ──────────────────────────────────

export const MAP_USAGE = {
  totalViews: 28_340,
  avgViewsPerUser: 81.7,
  interactions: {
    zoom: 12_450,
    floorSwitch: 8_920,
    poiClick: 6_780,
    panDrag: 18_340,
  },
  interactionBreakdown: [
    { name: "Pan/Drag", value: 18340 },
    { name: "Zoom", value: 12450 },
    { name: "Floor Switch", value: 8920 },
    { name: "POI Click", value: 6780 },
  ],
  dailyViews: dailyData((i) => 780 + Math.round(Math.sin(i / 3) * 120 + Math.random() * 80)),
};

// ─── 16. VPS_ANALYTICS ──────────────────────────────

export const VPS_ANALYTICS = {
  detectionSuccess: 96.4,
  driftRate: 3.2,
  avgAccuracy: 0.42, // meters
  recoveryTime: 1.8, // seconds
  failureRate: 3.6,
  accuracyTrend: weeklyData((i) => +(0.52 - i * 0.008 + Math.random() * 0.04).toFixed(2)),
  failuresByType: [
    { name: "Low visibility", count: 142 },
    { name: "Featureless area", count: 98 },
    { name: "Camera obstruction", count: 67 },
    { name: "Model mismatch", count: 45 },
    { name: "Network delay", count: 31 },
  ],
};

// ─── 17. SYSTEM_PERFORMANCE ─────────────────────────

export const SYSTEM_PERFORMANCE = {
  mapLoadTime: 1.24, // seconds
  navStartLatency: 0.34,
  calcTime: 0.18,
  e57ProcessingTime: 45.2, // minutes
  mapStitchTime: 12.8,
  uploadTime: 3.4,
  loadTimeTrend: dailyData((i) => +(1.1 + Math.random() * 0.4).toFixed(2)),
  performanceBreakdown: [
    { name: "Map Loading", value: 1.24, unit: "sec" },
    { name: "Nav Calculation", value: 0.18, unit: "sec" },
    { name: "Nav Start", value: 0.34, unit: "sec" },
    { name: "E57 Processing", value: 45.2, unit: "min" },
    { name: "Map Stitching", value: 12.8, unit: "min" },
    { name: "Upload", value: 3.4, unit: "min" },
  ],
};

// ─── 18. SCAN_DATA ──────────────────────────────────

export const SCAN_DATA = {
  e57Processed: 247,
  coveragePercent: 94.2,
  missingAreas: ["Parking B2 South", "Utility Shaft 3", "Roof Access", "Stairwell 4 Upper"],
  scanDensity: FLOOR_NAMES.map((f, i) => ({
    name: f,
    density: [96, 94][i],
    scans: [72, 68][i],
  })),
  updateFrequency: [
    { name: "Weekly", scans: 12 },
    { name: "Bi-weekly", scans: 45 },
    { name: "Monthly", scans: 124 },
    { name: "Quarterly", scans: 66 },
  ],
};

// ─── 19. USER_ENGAGEMENT ────────────────────────────

export const USER_ENGAGEMENT = {
  dau: 124,
  wau: 267,
  mau: 347,
  avgSessionDuration: 8.4, // minutes
  featureUsage: [
    { name: "Navigation", value: 42 },
    { name: "Asset Search", value: 24 },
    { name: "QR Scan", value: 15 },
    { name: "Map Browse", value: 12 },
    { name: "Floor Plan View", value: 7 },
  ],
  dauTrend: dailyData((i) => 100 + Math.round(Math.sin(i / 5) * 20 + Math.random() * 15)),
  sessionDurationTrend: weeklyData((i) => +(7.2 + i * 0.1 + Math.random() * 0.5).toFixed(1)),
};

// ─── 20. HEATMAP_ANALYTICS ──────────────────────────

export const HEATMAP_ANALYTICS = {
  zoneCongestion: ZONES.map((z, i) => ({
    name: z,
    intensity: [0.85, 0.45, 0.68, 0.32, 0.21, 0.58, 0.72, 0.48][i],
    avgOccupancy: [34, 12, 22, 14, 4, 18, 28, 16][i],
  })),
  pathFrequency: [
    { from: "Lobby", to: "BIM Production", frequency: 1240, intensity: 0.92 },
    { from: "Cafeteria", to: "Admin Wing", frequency: 980, intensity: 0.78 },
    { from: "Lobby", to: "Training Wing", frequency: 870, intensity: 0.71 },
    { from: "Server Room", to: "BIM Zone", frequency: 760, intensity: 0.64 },
    { from: "Conference", to: "VR Lab", frequency: 650, intensity: 0.55 },
    { from: "Admin", to: "Cafeteria", frequency: 580, intensity: 0.49 },
  ],
  peakTimes: [
    { period: "9:00-10:00", intensity: 0.72 },
    { period: "10:00-11:00", intensity: 0.89 },
    { period: "11:00-12:00", intensity: 0.95 },
    { period: "12:00-13:00", intensity: 0.78 },
    { period: "13:00-14:00", intensity: 0.65 },
    { period: "14:00-15:00", intensity: 0.82 },
    { period: "15:00-16:00", intensity: 0.88 },
    { period: "16:00-17:00", intensity: 0.76 },
    { period: "17:00-18:00", intensity: 0.54 },
  ],
};

// ─── CORE KPIs ──────────────────────────────────────

export const CORE_KPIS = {
  totalNavSessions: 14_287,
  navSuccessRate: 88.5,
  avgMTTR: 4.7,
  avgNavTime: 4.2,
  mostVisitedAsset: "AC Unit - BIM Studio 1",
  techProductivity: 86.2,
  routeEfficiency: 82.4,
};

// ─── ANALYTICS CATEGORIES (sidebar navigation) ─────

export const ANALYTICS_CATEGORIES = [
  { id: "navigation-usage", label: "Navigation Usage", group: "Navigation" },
  { id: "search", label: "Search Analytics", group: "Navigation" },
  { id: "completion", label: "Nav Completion", group: "Navigation" },
  { id: "mttr", label: "MTTR", group: "Navigation" },
  { id: "asset-navigation", label: "Asset Navigation", group: "Assets" },
  { id: "technician", label: "Technician Activity", group: "Assets" },
  { id: "route-efficiency", label: "Route Efficiency", group: "Routes" },
  { id: "zone", label: "Zone Analytics", group: "Spatial" },
  { id: "floor", label: "Floor Analytics", group: "Spatial" },
  { id: "building", label: "Building Analytics", group: "Spatial" },
  { id: "pathfinding", label: "Pathfinding", group: "System" },
  { id: "arrival", label: "Arrival Analytics", group: "System" },
  { id: "asset-discovery", label: "Asset Discovery", group: "Assets" },
  { id: "qr-code", label: "QR Code Analytics", group: "Assets" },
  { id: "map-usage", label: "Map Usage", group: "Engagement" },
  { id: "vps", label: "VPS / Localization", group: "System" },
  { id: "system-performance", label: "System Performance", group: "System" },
  { id: "scan-data", label: "Scan Data", group: "System" },
  { id: "user-engagement", label: "User Engagement", group: "Engagement" },
  { id: "heatmap", label: "Heatmap Analytics", group: "Engagement" },
];
