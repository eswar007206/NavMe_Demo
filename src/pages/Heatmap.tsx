import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuShieldCheck as ShieldCheck,
  LuShieldOff as ShieldOff,
  LuRefreshCw as RefreshCw,
  LuLoaderCircle as Loader2,
  LuX as X,
  LuLayers as Layers,
  LuBuilding2 as Building2,
  LuLayoutGrid as LayoutGrid,
  LuDoorOpen as DoorOpen,
  LuConstruction as Construction,
} from "react-icons/lu";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FloorBlueprint } from "@/components/floor-plan/FloorBlueprint";
import type { PersonOnMap } from "@/components/floor-plan/FloorBlueprint";
import { BUILDING_OUTLINE, BUILDING_BOUNDS } from "@/data/heatmapData";
import { AR_BOUNDS } from "@/data/pinnacleArCoordinates";

const FloorBlueprint3D = lazy(() => import("@/components/floor-plan/FloorBlueprint3D"));

/* ── Floor config ────────────────────────────────────────── */

type FloorKey = "ground" | "first";
type MapViewMode = "2d" | "3d";

const DUMMY_PEOPLE_PER_FLOOR = 50;
const BUILDING_PADDING = 0.3;

const FLOORS: { key: FloorKey; label: string; image: string }[] = [
  { key: "ground", label: "Ground Floor", image: "/GroundFloor_HD.png" },
  { key: "first", label: "First Floor", image: "/FirstFloor_HD.png" },
];

/** Ray-casting point-in-polygon check against the building outline. */
function isInsideBuilding(bx: number, bz: number): boolean {
  const poly = BUILDING_OUTLINE;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z;
    const xj = poly[j].x, zj = poly[j].z;
    if ((zi > bz) !== (zj > bz) && bx < ((xj - xi) * (bz - zi)) / (zj - zi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Convert building coordinates to AR coordinates (inverse of arToBuilding). */
function buildingToAr(bx: number, bz: number): { arX: number; arZ: number } {
  const arX = AR_BOUNDS.xMin + ((bx - BUILDING_BOUNDS.xMin) / (BUILDING_BOUNDS.xMax - BUILDING_BOUNDS.xMin)) * (AR_BOUNDS.xMax - AR_BOUNDS.xMin);
  const arZ = AR_BOUNDS.zMin + ((bz - BUILDING_BOUNDS.zMin) / (BUILDING_BOUNDS.zMax - BUILDING_BOUNDS.zMin)) * (AR_BOUNDS.zMax - AR_BOUNDS.zMin);
  return { arX, arZ };
}

/** Convert AR coordinates to building coordinates. */
function arToBuildingCoords(arX: number, arZ: number): { bx: number; bz: number } {
  const bx = BUILDING_BOUNDS.xMin + ((arX - AR_BOUNDS.xMin) / (AR_BOUNDS.xMax - AR_BOUNDS.xMin)) * (BUILDING_BOUNDS.xMax - BUILDING_BOUNDS.xMin);
  const bz = BUILDING_BOUNDS.zMin + ((arZ - AR_BOUNDS.zMin) / (AR_BOUNDS.zMax - AR_BOUNDS.zMin)) * (BUILDING_BOUNDS.zMax - BUILDING_BOUNDS.zMin);
  return { bx, bz };
}

/** Generate dummy people with positions guaranteed to be inside the building polygon. */
function createDummyPeople(prefix: string): PersonOnMap[] {
  const people: PersonOnMap[] = [];
  const bxMin = -4.19 + BUILDING_PADDING;
  const bxMax = 9.41 - BUILDING_PADDING;
  const bzMin = -11.0 + BUILDING_PADDING;
  const bzMax = 4.48 - BUILDING_PADDING;
  let attempts = 0;
  while (people.length < DUMMY_PEOPLE_PER_FLOOR && attempts < 5000) {
    attempts++;
    const bx = bxMin + Math.random() * (bxMax - bxMin);
    const bz = bzMin + Math.random() * (bzMax - bzMin);
    if (isInsideBuilding(bx, bz)) {
      const { arX, arZ } = buildingToAr(bx, bz);
      people.push({
        id: `${prefix}-${people.length + 1}`,
        x: arX,
        y: arZ,
        userName: `Person ${prefix.toUpperCase()}-${String(people.length + 1).padStart(3, "0")}`,
      });
    }
  }
  return people;
}

/* ── Types ─────────────────────────────────────────────── */

interface AreaItem {
  id: string;
  name?: string;
  description?: string | null;
  is_active?: boolean;
  [key: string]: unknown;
}

interface Toast {
  id: number;
  name: string;
  blocked?: boolean;
  error?: boolean;
}

type TabKey = "floors" | "buildings" | "zones" | "passages";

const TABS: { key: TabKey; label: string; icon: typeof Layers; table: string; nameField: string }[] = [
  { key: "buildings", label: "Buildings", icon: Building2, table: "ar_ropin_buildings", nameField: "name_display" },
  { key: "floors", label: "Floors", icon: Layers, table: "ar_ropin_floors", nameField: "name_display" },
  { key: "zones", label: "Zones", icon: LayoutGrid, table: "ar_ropin_zones", nameField: "name_display" },
  { key: "passages", label: "Passages", icon: DoorOpen, table: "ar_ropin_entries", nameField: "name_display" },
];

/* ── Fetch helpers ─────────────────────────────────────── */

async function fetchItems(table: string): Promise<AreaItem[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/* ── Animation variants ────────────────────────────────── */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ── Component ─────────────────────────────────────────── */

export default function Heatmap() {
  const queryClient = useQueryClient();

  /* ── Floor selector ── */
  const [activeFloor, setActiveFloor] = useState<FloorKey>("ground");
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("3d");
  const [peopleByFloor, setPeopleByFloor] = useState<Record<FloorKey, PersonOnMap[]>>(() => ({
    ground: createDummyPeople("g"),
    first: createDummyPeople("f"),
  }));
  const currentFloor = FLOORS.find((f) => f.key === activeFloor)!;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPeopleByFloor((prev) => {
        const movePeople = (people: PersonOnMap[]) =>
          people.map((person) => {
            const newX = person.x + (Math.random() - 0.5) * 0.45;
            const newY = person.y + (Math.random() - 0.5) * 0.45;
            const { bx, bz } = arToBuildingCoords(newX, newY);
            if (isInsideBuilding(bx, bz)) {
              return { ...person, x: newX, y: newY };
            }
            return person;
          });

        return {
          ground: movePeople(prev.ground),
          first: movePeople(prev.first),
        };
      });
    }, 1200);

    return () => window.clearInterval(interval);
  }, []);

  /* ── Map zones from access_control_zones (floor-aware) ── */
  const { data: dbZones } = useQuery({
    queryKey: ["heatmap-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_control_zones")
        .select("*")
        .order("zone_id");
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        zone_id: r.zone_id as string,
        label: r.label as string,
        x: Number(r.x),
        y: Number(r.y),
        w: Number(r.w),
        h: Number(r.h),
        is_blocked: r.is_blocked as boolean,
        floor: (r.floor as string) || "ground",
      }));
    },
    refetchInterval: 10000,
  });

  const allZones = useMemo(() => dbZones ?? [], [dbZones]);

  // Filter zones for the active floor
  const mapZones = useMemo(
    () => allZones.filter((z) => z.floor === activeFloor),
    [allZones, activeFloor]
  );

  const blockedZones = useMemo(() => {
    const set = new Set<string>();
    mapZones.forEach((z) => { if (z.is_blocked) set.add(z.zone_id); });
    return set;
  }, [mapZones]);

  const handleZoneToggle = useCallback(async (zoneId: string) => {
    const zone = allZones.find((z) => z.zone_id === zoneId);
    if (!zone) return;
    await supabase
      .from("access_control_zones")
      .update({ is_blocked: !zone.is_blocked })
      .eq("zone_id", zoneId);
    queryClient.invalidateQueries({ queryKey: ["heatmap-zones"] });
    queryClient.invalidateQueries({ queryKey: ["access-control"] });
  }, [allZones, queryClient]);

  const handleUnblockAll = useCallback(async () => {
    // Only unblock zones on the active floor
    const floorZoneIds = mapZones.map((z) => z.zone_id);
    if (floorZoneIds.length === 0) return;
    await supabase
      .from("access_control_zones")
      .update({ is_blocked: false })
      .in("zone_id", floorZoneIds);
    queryClient.invalidateQueries({ queryKey: ["heatmap-zones"] });
    queryClient.invalidateQueries({ queryKey: ["access-control"] });
  }, [mapZones, queryClient]);

  /* ── Access control tabs ── */
  const [activeTab, setActiveTab] = useState<TabKey>("buildings");
  const [localStatus, setLocalStatus] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["access-control", currentTab.table],
    queryFn: () => fetchItems(currentTab.table),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (items) {
      const init: Record<string, boolean> = {};
      items.forEach((item) => (init[String(item.id)] = item.is_active ?? false));
      setLocalStatus(init);
    }
  }, [items]);

  const toggleItem = useCallback(
    async (id: string, name: string) => {
      const prev = localStatus[id] ?? false;
      const next = !prev;
      setTogglingId(id);
      setLocalStatus((s) => ({ ...s, [id]: next }));

      const { error } = await supabase
        .from(currentTab.table)
        .update({ is_active: next })
        .eq("id", id);

      setTogglingId(null);
      const toastId = Date.now();
      if (error) {
        setLocalStatus((s) => ({ ...s, [id]: prev }));
        setToasts((prev) => [...prev, { id: toastId, name, error: true }]);
      } else {
        setToasts((prev) => [...prev, { id: toastId, name, blocked: !next }]);
        queryClient.invalidateQueries({ queryKey: ["heatmap-zones"] });
      }
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== toastId)), 3000);
    },
    [localStatus, currentTab.table, queryClient],
  );

  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["heatmap-zones"] });
    queryClient.invalidateQueries({ queryKey: ["access-control", currentTab.table] });
  }, [queryClient, currentTab.table]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control"
        description="Manage zone access & security restrictions across venues"
        actions={
          <button
            type="button"
            onClick={refetchAll}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-ring"
            aria-label="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        }
        icon={<ShieldCheck className="w-6 h-6" />}
      />

      {/* ── Floor Plan Map ── */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden px-4 sm:px-5 pt-4 sm:pt-5 pb-0" aria-label="Floor map">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{currentFloor.label} — Zone Map</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click on any zone to block (red) or unblock (green) it
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {/* Floor selector tabs */}
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              {FLOORS.map((floor) => (
                <button
                  key={floor.key}
                  type="button"
                  onClick={() => setActiveFloor(floor.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeFloor === floor.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
                >
                  {floor.label}
                </button>
              ))}
            </div>

            {/* 2D / 3D toggle */}
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5" aria-label="Map view toggle">
              <button
                type="button"
                onClick={() => setMapViewMode("2d")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mapViewMode === "2d"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
              >
                2D
              </button>
              <button
                type="button"
                onClick={() => setMapViewMode("3d")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mapViewMode === "3d"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
              >
                3D
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-500/50" aria-hidden /> Open
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500/50" aria-hidden /> Restricted
              </span>
            </div>
          </div>
        </header>

        <div className="rounded-xl overflow-hidden border border-border/50 bg-background">
          {mapViewMode === "2d" ? (
            <FloorBlueprint
              key={`2d-${activeFloor}`}
              floorPlanImage={currentFloor.image}
              className="w-full"
              height={520}
              people={peopleByFloor[activeFloor]}
              zones={mapZones}
              blockedZones={blockedZones}
              onZoneToggle={handleZoneToggle}
            />
          ) : (
            <Suspense fallback={
              <div className="w-full flex items-center justify-center text-muted-foreground" style={{ height: 520 }}>
                <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading 3D map...
              </div>
            }>
              <FloorBlueprint3D
                key={`3d-${activeFloor}`}
                floorPlanImage={currentFloor.image}
                className="w-full"
                height={520}
                people={peopleByFloor[activeFloor]}
                zones={mapZones}
                blockedZones={blockedZones}
                onZoneToggle={handleZoneToggle}
              />
            </Suspense>
          )}
          {blockedZones.size > 0 && (
            <div className="px-4 py-2.5 border-t border-border/50 bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                Restricted zones: <strong>{blockedZones.size}</strong>
              </span>
              <button
                type="button"
                onClick={handleUnblockAll}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Open all
              </button>
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-border/50 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Legend:</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/50" aria-hidden /> Open</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/50" aria-hidden /> Restricted</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" aria-hidden /> Person</span>
            <span className="font-medium text-foreground">
              {peopleByFloor[activeFloor].length} people visible
            </span>
          </div>
        </div>
      </section>

      {/* ── Access Control Toggle Cards ── */}
      <section aria-label="Access control toggles">
        {/* Tab bar */}
        <div className="section-card p-1.5 sm:p-2 mb-4 sm:mb-6">
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="accessTab"
                      className="absolute inset-0 rounded-xl bg-primary/15 ring-1 ring-primary/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon className="w-4 h-4 relative z-10 shrink-0" />
                  <span className="relative z-10 truncate hidden sm:inline">{tab.label}</span>
                  <span className="relative z-10 truncate sm:hidden">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {itemsLoading ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Loading {currentTab.label.toLowerCase()}...
          </div>
        ) : items && items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-[200px] text-muted-foreground"
          >
            <Construction className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No {currentTab.label.toLowerCase()} configured</p>
            <p className="text-xs mt-1">Add {currentTab.label.toLowerCase()} from the database to manage access</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            {items?.map((item) => {
              const isBlocked = !(localStatus[item.id] ?? item.is_active ?? true);
              const displayName = (item[currentTab.nameField] || item.id) as string;
              const displayDesc = (item.description ?? "") as string;
              return (
                <motion.div
                  key={item.id}
                  variants={cardItem}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="section-card relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                          isBlocked ? "bg-black/15" : "bg-primary/15"
                        }`}
                      >
                        <currentTab.icon
                          className={`w-5 h-5 transition-colors duration-300 ${
                            isBlocked ? "text-black" : "text-primary"
                          }`}
                        />
                      </div>
                    </div>

                    <h3
                      className={`text-base font-bold tracking-tight transition-colors duration-300 ${
                        isBlocked ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {displayName}
                    </h3>
                    {displayDesc && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {displayDesc}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          isBlocked
                            ? "bg-black/15 text-black"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isBlocked ? "bg-black" : "bg-primary"
                          }`}
                        />
                        {isBlocked ? "Restricted" : "Open"}
                      </span>

                      <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
                        <button
                          type="button"
                          onClick={() => !isBlocked || togglingId === String(item.id) ? null : toggleItem(String(item.id), displayName)}
                          disabled={togglingId === String(item.id)}
                          className={`min-w-[72px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50 ${
                            !isBlocked
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-background"
                          }`}
                        >
                          {togglingId === String(item.id) && !isBlocked ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin inline-block" />
                          ) : (
                            "Open"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => isBlocked || togglingId === String(item.id) ? null : toggleItem(String(item.id), displayName)}
                          disabled={togglingId === String(item.id)}
                          className={`min-w-[72px] px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:opacity-50 ${
                            isBlocked
                              ? "bg-black text-white shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-background"
                          }`}
                        >
                          {togglingId === String(item.id) && isBlocked ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin inline-block" />
                          ) : (
                            "Restrict"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* Toasts */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9, x: 40 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`glass-panel px-4 py-3 flex items-center gap-3 min-w-[280px] shadow-2xl border ${
                toast.error ? "border-destructive/50" : toast.blocked ? "border-black/30" : "border-primary/30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  toast.error ? "bg-destructive/15" : toast.blocked ? "bg-black/15" : "bg-primary/15"
                }`}
              >
                {toast.error ? (
                  <ShieldOff className="w-4 h-4 text-destructive" />
                ) : toast.blocked ? (
                  <ShieldOff className="w-4 h-4 text-black" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{toast.name}</p>
                <p
                  className={`text-xs font-medium ${
                    toast.error ? "text-destructive" : toast.blocked ? "text-black" : "text-primary"
                  }`}
                >
                  {toast.error ? "Update failed. Try again." : toast.blocked ? "Access restricted" : "Access restored"}
                </p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
