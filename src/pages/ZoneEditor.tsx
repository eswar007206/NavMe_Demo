import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LuTrash2 as Trash,
  LuCheck as Check,
  LuPencil as Pencil,
  LuSave as Save,
  LuLoaderCircle as Loader2,
  LuPenLine as PenLine,
  LuUndo2 as Undo2,
} from "react-icons/lu";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useRBAC } from "@/hooks/useRBAC";
import { FLOOR_MAP_PNG, getFloorPlanPixels } from "@/data/floorPlanDimensions";
import { normalizeNavRowsFromSelect, type NavPathRow } from "@/lib/floorNavPaths";

/* ── Floor config ────────────────────────────────────────── */

type FloorKey = "ground" | "first";

const FLOORS: { key: FloorKey; label: string; invert?: boolean }[] = [
  { key: "ground", label: "Ground Floor" },
  { key: "first", label: "First Floor" },
];

/* ── Types ────────────────────────────────────────────────── */

interface DbZone {
  id: string;
  zone_id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  is_blocked: boolean;
  floor: string;
}

type ZoneType = "normal" | "fire_exit" | "restricted" | "vip";

interface EditorZone {
  dbId: string | null;
  zone_id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  floor: string;
  zone_type: ZoneType;
}

const QUERY_KEY = ["access-control-zones"];
/** Public cache — Access Control / Heatmap read this */
const NAV_PATHS_PUBLIC_KEY = ["floor-nav-paths"];
/** Zone Editor only — never wiped by other pages refetching */
const NAV_PATHS_EDITOR_KEY = ["floor-nav-paths", "zone-editor"] as const;

async function fetchZones(): Promise<DbZone[]> {
  const { data, error } = await supabase
    .from("access_control_zones")
    .select("*")
    .order("zone_id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    x: Number(r.x),
    y: Number(r.y),
    w: Number(r.w),
    h: Number(r.h),
    floor: (r as Record<string, unknown>).floor as string || "ground",
  }));
}

function dbToEditor(db: DbZone): EditorZone {
  return { dbId: db.id, zone_id: db.zone_id, label: db.label, x: db.x, y: db.y, w: db.w, h: db.h, floor: db.floor, zone_type: ((db as Record<string, unknown>).zone_type as ZoneType) || "normal" };
}

type DragMode = null | "move" | "resize-tl" | "resize-tr" | "resize-bl" | "resize-br" | "create";

interface NavPt {
  x: number;
  y: number;
}

let idCounter = Date.now();
function nextZoneId() {
  return `zone-${++idCounter}`;
}

export default function ZoneEditor() {
  const { canWrite } = useRBAC();
  const queryClient = useQueryClient();
  const [navPersistError, setNavPersistError] = useState<string | null>(null);
  const { data: dbZones, isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: fetchZones });

  const {
    data: navPathRows,
    isFetched: navPathsFetched,
    isError: navPathsQueryFailed,
    error: navPathsQueryError,
  } = useQuery({
    queryKey: NAV_PATHS_EDITOR_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("floor_nav_paths").select("floor, points");
      if (error) {
        console.warn("floor_nav_paths (run scripts/floor-nav-paths-setup.sql):", error.message);
        throw new Error(error.message);
      }
      return normalizeNavRowsFromSelect(data as { floor: string; points: unknown }[] | null);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
  });

  /** Single source of truth — survives tab switches; synced to DB automatically */
  const navPathsByFloor = useMemo((): Record<FloorKey, NavPt[]> => {
    const rows = Array.isArray(navPathRows) ? navPathRows : [];
    return {
      ground: rows.find((r) => r.floor === "ground")?.points ?? [],
      first: rows.find((r) => r.floor === "first")?.points ?? [],
    };
  }, [navPathRows]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistNavPathsToDb = useCallback(async () => {
    const rows = queryClient.getQueryData(NAV_PATHS_EDITOR_KEY) as NavPathRow[] | undefined;
    if (!Array.isArray(rows) || rows.length < 2) return;
    const g = rows.find((r) => r.floor === "ground")?.points ?? [];
    const f = rows.find((r) => r.floor === "first")?.points ?? [];
    const payload: NavPathRow[] = [
      { floor: "ground", points: g },
      { floor: "first", points: f },
    ];
    const { data: saved, error } = await supabase
      .from("floor_nav_paths")
      .upsert(
        [
          { floor: "ground", points: g },
          { floor: "first", points: f },
        ],
        { onConflict: "floor" },
      )
      .select("floor, points");

    if (error) {
      console.warn("floor_nav_paths save:", error.message);
      setNavPersistError(error.message);
      return;
    }
    setNavPersistError(null);
    const normalized =
      saved && saved.length > 0
        ? normalizeNavRowsFromSelect(saved as { floor: string; points: unknown }[])
        : payload;
    queryClient.setQueryData(NAV_PATHS_PUBLIC_KEY, normalized);
    queryClient.setQueryData(NAV_PATHS_EDITOR_KEY, normalized);
    void queryClient.invalidateQueries({ queryKey: NAV_PATHS_PUBLIC_KEY, exact: true });
    window.dispatchEvent(new CustomEvent("floor-nav-paths-updated"));
  }, [queryClient]);

  const schedulePersistNavPaths = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      persistTimer.current = null;
      void persistNavPathsToDb();
    }, 400);
  }, [persistNavPathsToDb]);

  const patchNavFloor = useCallback(
    (floor: FloorKey, updater: (pts: NavPt[]) => NavPt[]) => {
      queryClient.setQueryData(NAV_PATHS_EDITOR_KEY, (old) => {
        const list = Array.isArray(old) ? (old as NavPathRow[]) : [];
        const g0 = list.find((r) => r.floor === "ground")?.points ?? [];
        const f0 = list.find((r) => r.floor === "first")?.points ?? [];
        const next: Record<FloorKey, NavPt[]> = { ground: [...g0], first: [...f0] };
        next[floor] = updater(next[floor]);
        return [
          { floor: "ground", points: next.ground },
          { floor: "first", points: next.first },
        ];
      });
      schedulePersistNavPaths();
    },
    [queryClient, schedulePersistNavPaths],
  );

  useEffect(() => {
    const flush = () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
        persistTimer.current = null;
      }
      void persistNavPathsToDb();
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      flush();
    };
  }, [persistNavPathsToDb]);

  const [zones, setZones] = useState<EditorZone[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<FloorKey>("ground");
  const [dbLoaded, setDbLoaded] = useState(false);
  const [isDrawingNavPath, setIsDrawingNavPath] = useState(false);

  const currentFloor = FLOORS.find((f) => f.key === activeFloor)!;
  const { w: IMG_W, h: IMG_H } = getFloorPlanPixels(activeFloor);
  const floorPlanImage = FLOOR_MAP_PNG[activeFloor];

  // Sync DB data into local state on first load
  useEffect(() => {
    if (dbZones && !dbLoaded) {
      setZones(dbZones.map(dbToEditor));
      setDbLoaded(true);
    }
  }, [dbZones, dbLoaded]);

  // Zones for the current floor only
  const floorZones = zones.filter((z) => z.floor === activeFloor);

  const svgRef = useRef<SVGSVGElement>(null);
  const suppressNextNavClick = useRef(false);
  const dragMode = useRef<DragMode>(null);
  const dragZoneId = useRef<string | null>(null);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0, ow: 0, oh: 0 });

  const toSvg = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const selected = zones.find((z) => z.zone_id === selectedId) ?? null;

  const onPointerDown = useCallback(
    (e: React.MouseEvent, zoneId: string, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      const p = toSvg(e);
      if (!p) return;
      const zone = zones.find((z) => z.zone_id === zoneId);
      if (!zone) return;
      setSelectedId(zoneId);
      dragMode.current = mode;
      dragZoneId.current = zoneId;
      dragStart.current = { mx: p.x, my: p.y, ox: zone.x, oy: zone.y, ow: zone.w, oh: zone.h };
    },
    [zones, toSvg]
  );

  const onBgPointerDown = useCallback(
    (e: React.MouseEvent) => {
      if (isDrawingNavPath) return;
      const p = toSvg(e);
      if (!p) return;
      const zid = nextZoneId();
      const newZone: EditorZone = {
        dbId: null,
        zone_id: zid,
        label: "New Zone",
        x: p.x,
        y: p.y,
        w: 0,
        h: 0,
        floor: activeFloor,
        zone_type: "normal",
      };
      setZones((prev) => [...prev, newZone]);
      setSelectedId(zid);
      dragMode.current = "create";
      dragZoneId.current = zid;
      dragStart.current = { mx: p.x, my: p.y, ox: p.x, oy: p.y, ow: 0, oh: 0 };
    },
    [toSvg, activeFloor, isDrawingNavPath]
  );

  const navPathPoints = navPathsByFloor[activeFloor] ?? [];

  const appendNavPointAtClient = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      const x = Math.max(0, Math.min(IMG_W, svgPt.x));
      const y = Math.max(0, Math.min(IMG_H, svgPt.y));
      patchNavFloor(activeFloor, (pts) => [...pts, { x, y }]);
    },
    [activeFloor, IMG_W, IMG_H, patchNavFloor],
  );

  const addNavPathPoint = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (suppressNextNavClick.current) {
        suppressNextNavClick.current = false;
        return;
      }
      appendNavPointAtClient(e.clientX, e.clientY);
    },
    [appendNavPointAtClient],
  );

  const undoNavPoint = useCallback(() => {
    patchNavFloor(activeFloor, (pts) => pts.slice(0, -1));
  }, [activeFloor, patchNavFloor]);

  const clearNavPath = useCallback(() => {
    patchNavFloor(activeFloor, () => []);
  }, [activeFloor, patchNavFloor]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragMode.current || !dragZoneId.current) return;
      const p = toSvg(e as unknown as React.MouseEvent);
      if (!p) return;
      const dx = p.x - dragStart.current.mx;
      const dy = p.y - dragStart.current.my;
      const { ox, oy, ow, oh } = dragStart.current;

      setZones((prev) =>
        prev.map((z) => {
          if (z.zone_id !== dragZoneId.current) return z;
          const mode = dragMode.current;
          if (mode === "move") {
            return { ...z, x: Math.max(0, Math.min(IMG_W - z.w, ox + dx)), y: Math.max(0, Math.min(IMG_H - z.h, oy + dy)) };
          }
          if (mode === "create" || mode === "resize-br") {
            return { ...z, w: Math.max(10, ow + dx), h: Math.max(10, oh + dy) };
          }
          if (mode === "resize-tl") {
            const nw = Math.max(10, ow - dx);
            const nh = Math.max(10, oh - dy);
            return { ...z, x: ox + (ow - nw), y: oy + (oh - nh), w: nw, h: nh };
          }
          if (mode === "resize-tr") {
            const nw = Math.max(10, ow + dx);
            const nh = Math.max(10, oh - dy);
            return { ...z, y: oy + (oh - nh), w: nw, h: nh };
          }
          if (mode === "resize-bl") {
            const nw = Math.max(10, ow - dx);
            const nh = Math.max(10, oh + dy);
            return { ...z, x: ox + (ow - nw), w: nw, h: nh };
          }
          return z;
        })
      );
    };

    const onUp = () => {
      if (dragMode.current === "create") {
        setZones((prev) => prev.filter((z) => z.zone_id !== dragZoneId.current || (z.w > 10 && z.h > 10)));
      }
      dragMode.current = null;
      dragZoneId.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [toSvg, IMG_W, IMG_H]);

  const deleteZone = useCallback((zoneId: string) => {
    setZones((prev) => prev.filter((z) => z.zone_id !== zoneId));
    setSelectedId((prev) => (prev === zoneId ? null : prev));
  }, []);

  const updateZone = useCallback((zoneId: string, patch: Partial<EditorZone>) => {
    setZones((prev) => prev.map((z) => (z.zone_id === zoneId ? { ...z, ...patch } : z)));
  }, []);

  /** Save ALL zones (all floors) to Supabase. */
  const saveToDb = useCallback(async () => {
    setSaving(true);
    try {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
        persistTimer.current = null;
      }
      await persistNavPathsToDb();

      // Get existing zone_ids from DB so we know which ones to delete
      const { data: existing } = await supabase
        .from("access_control_zones")
        .select("zone_id");
      const existingIds = new Set((existing ?? []).map((r: { zone_id: string }) => r.zone_id));
      const currentIds = new Set(zones.map((z) => z.zone_id));

      // Delete zones that were removed (only those not in current list)
      const toDelete = [...existingIds].filter((id) => !currentIds.has(id));
      if (toDelete.length > 0) {
        const { error: delErr } = await supabase
          .from("access_control_zones")
          .delete()
          .in("zone_id", toDelete);
        if (delErr) throw delErr;
      }

      // Upsert all current zones (insert or update by zone_id)
      if (zones.length > 0) {
        const rows = Array.from(new Map(zones.map(z => [z.zone_id, z])).values()).map((z) => ({
          zone_id: z.zone_id,
          label: z.label,
          type: "other",
          zone_type: z.zone_type,
          x: Math.round(z.x),
          y: Math.round(z.y),
          w: Math.round(z.w),
          h: Math.round(z.h),
          is_blocked: false,
          floor: z.floor,
        }));
        const { error } = await supabase
          .from("access_control_zones")
          .upsert(rows, { onConflict: "zone_id" });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["heatmap-zones"] });
      const ed = queryClient.getQueryData(NAV_PATHS_EDITOR_KEY) as NavPathRow[] | undefined;
      if (ed?.length === 2) queryClient.setQueryData(NAV_PATHS_PUBLIC_KEY, ed);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to save zones:", JSON.stringify(err, null, 2));
      alert("Failed to save. Check the console for details.");
    } finally {
      setSaving(false);
    }
  }, [zones, queryClient, persistNavPathsToDb]);

  // Clear selection when switching floors
  const handleFloorChange = useCallback((floor: FloorKey) => {
    setActiveFloor(floor);
    setSelectedId(null);
    setEditingLabel(null);
    setIsDrawingNavPath(false);
  }, []);

  const HANDLE = 8;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Loading zones...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zone Editor"
        description={canWrite ? "Drag and drop to place access control zones on the floor plan" : "Viewing zones in read-only mode"}
        icon={<Pencil className="w-6 h-6" />}
      />

      {!canWrite && (
        <div className="section-card flex items-center gap-2 text-sm text-muted-foreground bg-muted/30">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          Read-only mode &mdash; you do not have write permissions
        </div>
      )}

      {navPathsQueryFailed && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <strong>Line paths can&apos;t load from the database.</strong> Run{" "}
          <code className="text-xs bg-muted px-1 rounded">scripts/floor-nav-paths-setup.sql</code> in Supabase SQL
          Editor.{" "}
          {navPathsQueryError instanceof Error ? navPathsQueryError.message : String(navPathsQueryError ?? "")}
        </div>
      )}
      {navPersistError && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          <strong>Could not save the line path:</strong> {navPersistError}
        </div>
      )}

      {/* Toolbar */}
      <div className="section-card flex flex-wrap items-center gap-3">
        {/* Floor selector */}
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
          {FLOORS.map((floor) => (
            <button
              key={floor.key}
              type="button"
              onClick={() => handleFloorChange(floor.key)}
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

        {canWrite && !isDrawingNavPath && (
          <span className="text-xs text-muted-foreground">Click &amp; drag on empty area to create a zone.</span>
        )}
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!navPathsFetched || navPathsQueryFailed}
              onClick={() => setIsDrawingNavPath((v) => !v)}
              title={
                navPathsQueryFailed
                  ? "Fix database (see banner), then refresh the page"
                  : !navPathsFetched
                    ? "Loading saved paths…"
                    : undefined
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDrawingNavPath
                  ? "bg-blue-600 text-white shadow-sm"
                  : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              {!navPathsFetched
                ? "Loading paths…"
                : isDrawingNavPath
                  ? "Drawing line — click map"
                  : "Draw line path"}
            </button>
            {navPathPoints.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={undoNavPoint}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted/50"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Undo point
                </button>
                <button
                  type="button"
                  onClick={clearNavPath}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border text-red-500 hover:bg-red-500/10"
                >
                  <Trash className="w-3.5 h-3.5" /> Clear line
                </button>
                <span className="text-xs text-muted-foreground">{navPathPoints.length} pts</span>
              </>
            )}
          </div>
        )}
        {canWrite && isDrawingNavPath && (
          <span className="text-xs text-amber-600 font-medium">
            Click the map to add points. The line <strong>saves automatically</strong> and appears on Access Control.
          </span>
        )}
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">{floorZones.length} zones on {currentFloor.label}</span>
        {lastSaved && (
          <span className="text-[11px] text-green-500 flex items-center gap-1">
            <Check className="w-3 h-3" /> Saved at {lastSaved}
          </span>
        )}
        {canWrite && (
          <button
            type="button"
            onClick={saveToDb}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* SVG Canvas */}
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden">
          <div className="relative" style={{ aspectRatio: `${IMG_W} / ${IMG_H}` }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${IMG_W} ${IMG_H}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                cursor: canWrite ? (isDrawingNavPath ? "crosshair" : "crosshair") : "default",
              }}
              onMouseDown={canWrite && !isDrawingNavPath ? onBgPointerDown : undefined}
            >
              <image
                href={floorPlanImage}
                x="0"
                y="0"
                width={IMG_W}
                height={IMG_H}
                preserveAspectRatio="none"
                style={currentFloor.invert ? { filter: "invert(1)" } : undefined}
              />
              {floorZones.map((z) => {
                const isSel = z.zone_id === selectedId;
                const isFire = z.zone_type === "fire_exit";
                const fillColor = isSel
                  ? "rgba(59, 130, 246, 0.35)"
                  : z.zone_type === "fire_exit"
                    ? "rgba(249, 115, 22, 0.3)"
                  : z.zone_type === "restricted"
                    ? "rgba(239, 68, 68, 0.3)"
                  : z.zone_type === "vip"
                    ? "rgba(168, 85, 247, 0.3)"
                    : "rgba(34, 197, 94, 0.3)";
                const strokeColor = isSel ? "#3b82f6" 
                  : z.zone_type === "fire_exit" ? "#f97316" 
                  : z.zone_type === "restricted" ? "#ef4444" 
                  : z.zone_type === "vip" ? "#a855f7" 
                  : "#22c55e";
                return (
                  <g key={z.zone_id}>
                    <rect
                      x={z.x}
                      y={z.y}
                      width={z.w}
                      height={z.h}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSel ? 3 : 2}
                      style={{ cursor: canWrite ? "move" : "default" }}
                      onMouseDown={canWrite ? (e) => onPointerDown(e, z.zone_id, "move") : undefined}
                    />
                    <text
                      x={z.x + z.w / 2}
                      y={z.y + z.h / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize={Math.min(12, z.w / 6)}
                      fontWeight={600}
                      style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                    >
                      {z.label}
                    </text>
                    {isSel && canWrite && (
                      <>
                        <rect x={z.x - HANDLE / 2} y={z.y - HANDLE / 2} width={HANDLE} height={HANDLE} fill="white" stroke="#3b82f6" strokeWidth={1.5} style={{ cursor: "nwse-resize" }} onMouseDown={(e) => onPointerDown(e, z.zone_id, "resize-tl")} />
                        <rect x={z.x + z.w - HANDLE / 2} y={z.y - HANDLE / 2} width={HANDLE} height={HANDLE} fill="white" stroke="#3b82f6" strokeWidth={1.5} style={{ cursor: "nesw-resize" }} onMouseDown={(e) => onPointerDown(e, z.zone_id, "resize-tr")} />
                        <rect x={z.x - HANDLE / 2} y={z.y + z.h - HANDLE / 2} width={HANDLE} height={HANDLE} fill="white" stroke="#3b82f6" strokeWidth={1.5} style={{ cursor: "nesw-resize" }} onMouseDown={(e) => onPointerDown(e, z.zone_id, "resize-bl")} />
                        <rect x={z.x + z.w - HANDLE / 2} y={z.y + z.h - HANDLE / 2} width={HANDLE} height={HANDLE} fill="white" stroke="#3b82f6" strokeWidth={1.5} style={{ cursor: "nwse-resize" }} onMouseDown={(e) => onPointerDown(e, z.zone_id, "resize-br")} />
                      </>
                    )}
                  </g>
                );
              })}
              {navPathPoints.length >= 2 && (
                <polyline
                  points={navPathPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={Math.max(2, IMG_W / 900)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: "none" }}
                />
              )}
              {navPathPoints.map((p, i) => (
                <circle
                  key={`nav-${activeFloor}-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={Math.max(5, IMG_W / 520)}
                  fill="#2563eb"
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ pointerEvents: "none" }}
                />
              ))}
              {canWrite && isDrawingNavPath && (
                <rect
                  x={0}
                  y={0}
                  width={IMG_W}
                  height={IMG_H}
                  fill="rgba(30,64,175,0.06)"
                  style={{ cursor: "crosshair", touchAction: "manipulation" }}
                  onClick={addNavPathPoint}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    suppressNextNavClick.current = true;
                    window.setTimeout(() => {
                      suppressNextNavClick.current = false;
                    }, 500);
                    const t = e.changedTouches[0];
                    if (t) appendNavPointAtClient(t.clientX, t.clientY);
                  }}
                />
              )}
            </svg>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:w-[300px] shrink-0 space-y-3">
          <div className="section-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Zones — {currentFloor.label} ({floorZones.length})</h3>
            {floorZones.length === 0 ? (
              <p className="text-xs text-muted-foreground">Click and drag on the floor plan to add the first zone.</p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {floorZones.map((z) => (
                  <button
                    key={z.zone_id}
                    type="button"
                    onClick={() => setSelectedId(z.zone_id)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      z.zone_id === selectedId
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: z.zone_id === selectedId ? "#3b82f6" : z.zone_type === "fire_exit" ? "#f97316" : z.zone_type === "restricted" ? "#ef4444" : z.zone_type === "vip" ? "#a855f7" : "#22c55e" }} />
                    <span className="truncate">{z.label}</span>
                    {z.zone_type === "fire_exit" && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-500 shrink-0">FIRE</span>
                    )}
                    {z.zone_type === "restricted" && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 shrink-0">RESTRICTED</span>
                    )}
                    {z.zone_type === "vip" && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-500 shrink-0">VIP</span>
                    )}
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground shrink-0">{z.zone_id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && selected.floor === activeFloor && (
            <div className="section-card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Properties</h3>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => deleteZone(selected.zone_id)}
                    className="text-red-500 hover:text-red-400 p-1 rounded transition-colors"
                    title="Delete zone"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Label */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Label</label>
                {editingLabel === selected.zone_id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateZone(selected.zone_id, { label: labelDraft });
                      setEditingLabel(null);
                    }}
                    className="flex gap-1"
                  >
                    <input
                      autoFocus
                      value={labelDraft}
                      onChange={(e) => setLabelDraft(e.target.value)}
                      onBlur={() => {
                        updateZone(selected.zone_id, { label: labelDraft });
                        setEditingLabel(null);
                      }}
                      className="flex-1 min-w-0 rounded border border-border bg-muted/20 px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLabel(selected.zone_id);
                      setLabelDraft(selected.label);
                    }}
                    className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors"
                  >
                    {selected.label} <Pencil className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Zone ID — this links to access control tables */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Zone ID</label>
                <input
                  value={selected.zone_id}
                  onChange={(e) => updateZone(selected.zone_id, { zone_id: e.target.value })}
                  className="w-full rounded border border-border bg-muted/20 px-2 py-1.5 text-sm font-mono font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Use the same ID in Zones/Passages/Floors/Buildings to link access control
                </p>
              </div>

              {/* Zone Type */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Zone Type</label>
                {canWrite ? (
                  <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-1">
                    <button
                      type="button"
                      onClick={() => updateZone(selected.zone_id, { zone_type: "normal" })}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selected.zone_type === "normal"
                          ? "bg-green-500 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-background"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => updateZone(selected.zone_id, { zone_type: "fire_exit" })}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selected.zone_type === "fire_exit"
                          ? "bg-orange-500 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-background"
                      }`}
                    >
                      Fire Exit
                    </button>
                    <button
                      type="button"
                      onClick={() => updateZone(selected.zone_id, { zone_type: "restricted" })}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selected.zone_type === "restricted"
                          ? "bg-red-500 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-background"
                      }`}
                    >
                      Restricted
                    </button>
                    <button
                      type="button"
                      onClick={() => updateZone(selected.zone_id, { zone_type: "vip" })}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selected.zone_type === "vip"
                          ? "bg-purple-500 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-background"
                      }`}
                    >
                      VIP Area
                    </button>
                  </div>
                ) : (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    selected.zone_type === "fire_exit" ? "bg-orange-500/15 text-orange-500" : 
                    selected.zone_type === "restricted" ? "bg-red-500/15 text-red-500" :
                    selected.zone_type === "vip" ? "bg-purple-500/15 text-purple-500" :
                    "bg-green-500/15 text-green-500"
                  }`}>
                    {selected.zone_type === "fire_exit" ? "Fire Exit" : 
                     selected.zone_type === "restricted" ? "Restricted" :
                     selected.zone_type === "vip" ? "VIP Area" :
                     "Normal"}
                  </span>
                )}
              </div>

              {/* Floor */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Floor</label>
                <span className="text-xs font-medium text-foreground">{currentFloor.label}</span>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">X</label>
                  <span className="text-xs font-mono text-foreground">{Math.round(selected.x)}</span>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Y</label>
                  <span className="text-xs font-mono text-foreground">{Math.round(selected.y)}</span>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Width</label>
                  <span className="text-xs font-mono text-foreground">{Math.round(selected.w)}</span>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">Height</label>
                  <span className="text-xs font-mono text-foreground">{Math.round(selected.h)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
