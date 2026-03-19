import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuShieldAlert as ShieldAlert,
  LuSiren as Siren,
  LuUsers as Users,
  LuDoorOpen as DoorOpen,
  LuShieldCheck as ShieldCheck,
  LuTriangleAlert as TriangleAlert,
  LuRadio as Radio,
  LuClock as Clock,
  LuMapPin as MapPin,
  LuPhoneCall as PhoneCall,
  LuX as X,
  LuCheck as Check,
  LuLoaderCircle as Loader2,
  LuOctagonX as OctagonX,
} from "react-icons/lu";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/dashboard/PageHeader";
import type { EmergencyStuckReport, EmergencyCheckin, UnifiedEmergencyResponse } from "@/lib/emergency-types";
import { ResponseSummaryCards } from "@/components/emergency/ResponseSummaryCards";
import { PeopleNeedingHelp } from "@/components/emergency/PeopleNeedingHelp";
import { ActiveRescuers } from "@/components/emergency/ActiveRescuers";
import { PeopleEvacuating } from "@/components/emergency/PeopleEvacuating";
import { AllResponses } from "@/components/emergency/AllResponses";

/* ── Constants ───────────────────────────────────────────── */

const EMERGENCY_ROW_ID = "00000000-0000-0000-0000-000000000001";
const EMERGENCY_QUERY_KEY = ["emergency-state"];
const ZONES_QUERY_KEY = ["emergency-zones"];
const STUCK_REPORTS_KEY = ["emergency-stuck"];
const CHECKINS_KEY = ["emergency-checkins"];

/* ── Types ───────────────────────────────────────────────── */

interface EmergencyRow {
  id: string;
  is_active: boolean;
  activated_at: string | null;
  activated_by: string | null;
}

interface ZoneRow {
  zone_id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  is_blocked: boolean;
  floor: string;
  zone_type: string;
}

/* ── Dummy evacuation data ──────────────────────────────── */

const TOTAL_BUILDING_OCCUPANCY = 487;

function generateEvacuationProgress(elapsedSec: number) {
  const maxTime = 300;
  const progress = Math.min(1, elapsedSec / maxTime);
  const curve = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  const evacuated = Math.floor(TOTAL_BUILDING_OCCUPANCY * curve);
  return {
    total: TOTAL_BUILDING_OCCUPANCY,
    evacuated,
    remaining: TOTAL_BUILDING_OCCUPANCY - evacuated,
    percentEvacuated: Math.round(curve * 100),
  };
}

const FLOOR_STATS = [
  { floor: "Ground Floor", people: 263, exits: 4 },
  { floor: "First Floor", people: 224, exits: 3 },
];

const EMERGENCY_CONTACTS = [
  { name: "Fire Department", number: "101", priority: "high" },
  { name: "Building Security", number: "Ext. 5001", priority: "high" },
  { name: "Medical Emergency", number: "108", priority: "medium" },
  { name: "Police", number: "100", priority: "medium" },
];

/* ── DB helpers ──────────────────────────────────────────── */

async function fetchEmergencyState(): Promise<EmergencyRow> {
  const { data, error } = await supabase
    .from("emergency_state")
    .select("*")
    .eq("id", EMERGENCY_ROW_ID)
    .single();
  if (error) throw error;
  return data as EmergencyRow;
}

async function fetchZones(): Promise<ZoneRow[]> {
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
    zone_type: (r.zone_type as string) || "normal",
  }));
}

async function fetchEmergencyStuckReports(): Promise<EmergencyStuckReport[]> {
  const { data, error } = await supabase
    .from("emergency_stuck_reports")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EmergencyStuckReport[];
}

async function fetchEmergencyCheckins(): Promise<EmergencyCheckin[]> {
  const { data, error } = await supabase
    .from("emergency_checkins")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EmergencyCheckin[];
}

/* ── Component ──────────────────────────────────────────── */

export default function EmergencySOS() {
  const queryClient = useQueryClient();

  /* ── Local UI state ── */
  const [isActivating, setIsActivating] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [evacuationLog, setEvacuationLog] = useState<{ time: string; message: string; type: "info" | "warn" | "success" }[]>([]);
  const [dismissedPopup, setDismissedPopup] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logInitialized = useRef(false);

  /* ── Fetch emergency state from DB ── */
  const { data: emergencyState, isLoading: loadingState } = useQuery({
    queryKey: EMERGENCY_QUERY_KEY,
    queryFn: fetchEmergencyState,
  });

  /* ── Fetch zones ── */
  const { data: dbZones, isLoading: loadingZones } = useQuery({
    queryKey: ZONES_QUERY_KEY,
    queryFn: fetchZones,
    refetchInterval: 5000,
  });

  const isEmergencyActive = emergencyState?.is_active ?? false;
  const activatedAt = emergencyState?.activated_at ? new Date(emergencyState.activated_at).getTime() : null;

  const allZones = useMemo(() => dbZones ?? [], [dbZones]);
  const fireExitZones = useMemo(() => allZones.filter((z) => z.zone_type === "fire_exit"), [allZones]);
  const normalZones = useMemo(() => allZones.filter((z) => z.zone_type === "normal"), [allZones]);
  const blockedFireZones = useMemo(() => fireExitZones.filter((z) => z.is_blocked), [fireExitZones]);

  /* ── Fetch emergency responses (only when active) ── */
  const { data: stuckReports } = useQuery({
    queryKey: STUCK_REPORTS_KEY,
    queryFn: fetchEmergencyStuckReports,
    enabled: isEmergencyActive,
  });

  const { data: checkins } = useQuery({
    queryKey: CHECKINS_KEY,
    queryFn: fetchEmergencyCheckins,
    enabled: isEmergencyActive,
  });

  // Map to unified response format for components
  const unifiedResponses = useMemo<UnifiedEmergencyResponse[]>(() => {
    const sr = (stuckReports ?? []).map(r => ({
      ...r,
      source: "stuck" as const,
      acknowledged: true,
      acknowledged_at: r.created_at,
      ability_status: "not_able_to_walk" as const, // Assume stuck people probably can't walk or move easily
      choice: "stuck" as const,
      navigation_status: r.status,
    }));
    
    const ch = (checkins ?? []).map(r => ({
      ...r,
      source: "checkin" as const,
      acknowledged: true,
      acknowledged_at: r.created_at,
      ability_status: r.is_physically_able ? ("physically_abled" as const) : ("not_able_to_walk" as const),
      choice: r.is_in_safe_place ? ("safe_place" as const) : null,
      navigation_status: r.is_in_safe_place ? "safe_place" : r.status,
    }));
    
    return [...sr, ...ch].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [stuckReports, checkins]);

  /* ── Supabase Realtime subscriptions (replaces polling) ── */
  useEffect(() => {
    const channel = supabase
      .channel("emergency-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_state" },
        () => {
          queryClient.invalidateQueries({ queryKey: EMERGENCY_QUERY_KEY });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_stuck_reports" },
        () => {
          queryClient.invalidateQueries({ queryKey: STUCK_REPORTS_KEY });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emergency_checkins" },
        () => {
          queryClient.invalidateQueries({ queryKey: CHECKINS_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const responseSummary = useMemo(() => {
    const list = unifiedResponses;
    const acknowledged = list.filter((r) => r.acknowledged);
    
    // Using simple mapping since AR app checkins/stuck reports have slightly different statuses
    const needsHelpList = list.filter(r => r.source === "stuck" || (!r.ability_status && r.choice !== "safe_place"));
    
    // In new schema, rescuers might not be tracked directly in these tables, but we leave the logic intact
    const rescuersList = list.filter((r) => r.choice === "save_someone");
    const activeRescuers = rescuersList.filter(
      (r) =>
        r.navigation_status === "navigating_to_rescue" ||
        r.navigation_status === "reached_person",
    );
    const evacuatingList = list.filter(
      (r) =>
        r.navigation_status === "navigating_to_exit" ||
        r.navigation_status === "reached_exit",
    );
    const reachedExit = list.filter((r) => r.navigation_status === "reached_exit" || r.navigation_status === "safe_place");

    return {
      total: list.length,
      acknowledged: acknowledged.length,
      needsHelp: needsHelpList.length,
      needsHelpList,
      rescuersActive: activeRescuers.length,
      rescuersList,
      evacuating: evacuatingList.length,
      evacuatingList,
      reachedExit: reachedExit.length,
    };
  }, [unifiedResponses]);

  /* ── Elapsed timer (derived from DB activated_at) ── */
  useEffect(() => {
    if (!isEmergencyActive || !activatedAt) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - activatedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isEmergencyActive, activatedAt]);

  const evacuationStats = useMemo(
    () => generateEvacuationProgress(elapsedSeconds),
    [elapsedSeconds]
  );

  /* ── Evacuation log simulation (only once per emergency session) ── */
  useEffect(() => {
    if (!isEmergencyActive) {
      logInitialized.current = false;
      setEvacuationLog([]);
      setDismissedPopup(false);
      return;
    }
    if (logInitialized.current) return;
    logInitialized.current = true;

    setEvacuationLog([{
      time: new Date().toLocaleTimeString(),
      message: "EMERGENCY PROTOCOL ACTIVATED",
      type: "warn",
    }]);

    const messages = [
      { delay: 2, message: "Emergency alarm activated on all floors", type: "warn" as const },
      { delay: 5, message: "Fire exit zones locked down — blocking hazardous areas", type: "warn" as const },
      { delay: 8, message: "PA system broadcasting evacuation instructions", type: "info" as const },
      { delay: 12, message: "Ground floor east wing evacuated", type: "success" as const },
      { delay: 18, message: "Elevator systems disabled — use stairs only", type: "warn" as const },
      { delay: 25, message: "First floor north section cleared", type: "success" as const },
      { delay: 35, message: "Emergency services notified — ETA 4 minutes", type: "info" as const },
      { delay: 60, message: "Ground floor fully evacuated", type: "success" as const },
      { delay: 80, message: "First floor evacuation 85% complete", type: "info" as const },
      { delay: 100, message: "Security sweep initiated on cleared floors", type: "info" as const },
      { delay: 120, message: "Emergency responders on site", type: "success" as const },
    ];

    const timers = messages.map((m) =>
      setTimeout(() => {
        setEvacuationLog((prev) => [
          { time: new Date().toLocaleTimeString(), message: m.message, type: m.type },
          ...prev,
        ]);
      }, m.delay * 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, [isEmergencyActive]);

  /* ── Merged log: real response events + simulated log ── */
  const mergedLog = useMemo(() => {
    const realEvents: { time: string; message: string; type: "info" | "warn" | "success" }[] = [];

    unifiedResponses.forEach((r) => {
      if (r.source === "stuck") {
        realEvents.push({
          time: new Date(r.created_at).toLocaleTimeString(),
          message: `${r.user_name} reported stuck: ${r.issue_description || 'Need help'}`,
          type: "warn",
        });
      } else if (r.source === "checkin") {
        const text = r.choice === "safe_place" ? "is in a safe place" : "checked in";
        const type = r.choice === "safe_place" ? "success" : "info";
        realEvents.push({
          time: new Date(r.created_at).toLocaleTimeString(),
          message: `${r.user_name} ${text}`,
          type,
        });
      }
    });

    return [...realEvents, ...evacuationLog].sort((a, b) => b.time.localeCompare(a.time));
  }, [unifiedResponses, evacuationLog]);

  /* ── Activate emergency (write to DB) ── */
  const activateEmergency = useCallback(async () => {
    setIsActivating(true);
    setShowConfirmDialog(false);

    // 1. Set emergency_state to active via RPC mapped function to bypass RLS securely
    await supabase.rpc('toggle_emergency', { activate: true, email: 'admin@navmedemo.com' });

    // 2. Block all fire exit zones
    const fireZoneIds = fireExitZones.map((z) => z.zone_id);
    if (fireZoneIds.length > 0) {
      await supabase
        .from("access_control_zones")
        .update({ is_blocked: true })
        .in("zone_id", fireZoneIds);
    }

    // 3. Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: EMERGENCY_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ZONES_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["heatmap-zones"] });
    queryClient.invalidateQueries({ queryKey: ["access-control-zones"] });

    setIsActivating(false);
  }, [fireExitZones, queryClient]);

  /* ── Deactivate emergency (write to DB) ── */
  const deactivateEmergency = useCallback(async () => {
    setShowDeactivateDialog(false);

    try {
      // 1. Set emergency_state to inactive via RPC
      const { error: rpcError } = await supabase.rpc('toggle_emergency', { activate: false, email: 'admin@navmedemo.com' });
      if (rpcError) {
        console.error("Stand down RPC failed:", rpcError);
        alert("Failed to stand down: " + rpcError.message);
        return;
      }

      // 2. Unblock all fire exit zones
      const fireZoneIds = fireExitZones.map((z) => z.zone_id);
      if (fireZoneIds.length > 0) {
        const { error: updateErr } = await supabase
          .from("access_control_zones")
          .update({ is_blocked: false })
          .in("zone_id", fireZoneIds);
        if (updateErr) console.error("Failed to unblock zones:", updateErr);
      }

      // 3. Invalidate
      queryClient.invalidateQueries({ queryKey: EMERGENCY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ZONES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CHECKINS_KEY });
      queryClient.invalidateQueries({ queryKey: STUCK_REPORTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["heatmap-zones"] });
      queryClient.invalidateQueries({ queryKey: ["access-control-zones"] });
    } catch (err) {
      console.error("Stand down error:", err);
      alert("Stand down failed. Check the console for details.");
    }
  }, [fireExitZones, queryClient]);

  /* ── Hold-to-activate logic ── */
  const startHold = useCallback(() => {
    setHoldProgress(0);
    let progress = 0;
    holdTimerRef.current = setInterval(() => {
      progress += 2;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        setShowConfirmDialog(true);
      }
    }, 30);
  }, []);

  const endHold = useCallback(() => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setHoldProgress(0);
  }, []);

  /* ── Format elapsed time ── */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isLoading = loadingState || loadingZones;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Loading emergency systems...
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 relative z-10 ${isEmergencyActive ? "emergency-active-page" : ""}`}>
        <PageHeader
          title="Emergency Control"
          description="Fire exit lockdown & evacuation management system"
          icon={<ShieldAlert className="w-6 h-6" />}
        />

        {/* ── STAND DOWN banner (always visible when active) ── */}
        <AnimatePresence>
          {isEmergencyActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white px-5 py-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-emergency-banner shadow-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Siren className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-wide">EMERGENCY PROTOCOL ACTIVE</p>
                    <p className="text-xs text-red-100">
                      {fireExitZones.length} fire exit zones locked down &bull; Elapsed: {formatTime(elapsedSeconds)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeactivateDialog(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-red-700 hover:bg-red-50 rounded-xl text-sm font-bold transition-colors shadow-md shrink-0"
                >
                  <OctagonX className="w-4 h-4" />
                  STAND DOWN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="section-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{fireExitZones.length}</p>
              <p className="text-[11px] text-muted-foreground">Fire Exit Zones</p>
            </div>
          </div>
          <div className="section-card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${blockedFireZones.length > 0 ? "bg-red-800/15" : "bg-green-500/15"}`}>
              <ShieldCheck className={`w-5 h-5 ${blockedFireZones.length > 0 ? "text-red-800 dark:text-red-400" : "text-green-500"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{blockedFireZones.length}</p>
              <p className="text-[11px] text-muted-foreground">Currently Blocked</p>
            </div>
          </div>
          <div className="section-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{TOTAL_BUILDING_OCCUPANCY}</p>
              <p className="text-[11px] text-muted-foreground">Total Occupancy</p>
            </div>
          </div>
          <div className="section-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
              <DoorOpen className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{normalZones.length}</p>
              <p className="text-[11px] text-muted-foreground">Safe Zones</p>
            </div>
          </div>
        </div>

        {/* ── Response summary cards (only when active) ── */}
        {isEmergencyActive && (
          <ResponseSummaryCards
            acknowledged={responseSummary.acknowledged}
            total={responseSummary.total}
            needsHelp={responseSummary.needsHelp}
            rescuersActive={responseSummary.rescuersActive}
            evacuating={responseSummary.evacuating}
            reachedExit={responseSummary.reachedExit}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── LEFT: SOS Button + Zone Status ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* SOS Button Card */}
            <div className={`rounded-2xl border-2 p-6 sm:p-8 text-center transition-all duration-500 ${
              isEmergencyActive
                ? "border-red-500/50 bg-red-500/5"
                : "border-border bg-card"
            }`}>
              {!isEmergencyActive ? (
                <>
                  <div className="mb-4">
                    <p className="text-lg font-bold text-foreground">Emergency Lockdown</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hold the button below to initiate emergency protocol. This will immediately block all {fireExitZones.length} fire exit zones.
                    </p>
                  </div>

                  {/* The SOS Button */}
                  <div className="relative inline-flex items-center justify-center my-4">
                    <div className="absolute w-52 h-52 rounded-full border-2 border-red-500/20 animate-ping-slow" />
                    <div className="absolute w-44 h-44 rounded-full border border-red-500/10 animate-ping-slower" />

                    <svg className="absolute w-48 h-48" viewBox="0 0 192 192">
                      <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="4" className="text-red-500/20" />
                      <circle
                        cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                        className="text-red-500 transition-all"
                        strokeDasharray={2 * Math.PI * 88}
                        strokeDashoffset={2 * Math.PI * 88 * (1 - holdProgress / 100)}
                        transform="rotate(-90 96 96)"
                      />
                    </svg>

                    <button
                      onMouseDown={startHold}
                      onMouseUp={endHold}
                      onMouseLeave={endHold}
                      onTouchStart={startHold}
                      onTouchEnd={endHold}
                      disabled={isActivating}
                      className="relative w-40 h-40 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(239,68,68,0.6),inset_0_2px_4px_rgba(255,255,255,0.25)] active:shadow-[0_0_20px_rgba(239,68,68,0.3),inset_0_4px_8px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-1 select-none cursor-pointer group disabled:opacity-50"
                    >
                      {isActivating ? (
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      ) : (
                        <>
                          <Siren className="w-10 h-10 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                          <span className="text-white font-black text-xl tracking-wider drop-shadow-lg">SOS</span>
                          <span className="text-white/70 text-[10px] font-medium">HOLD TO ACTIVATE</span>
                        </>
                      )}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/10 pointer-events-none" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    Hold the SOS button for 1.5 seconds to trigger emergency lockdown
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 text-red-500 text-sm font-bold mb-4">
                      <Radio className="w-4 h-4 animate-pulse" />
                      EMERGENCY ACTIVE
                    </div>
                    <div className="flex items-center justify-center gap-2 text-4xl font-mono font-bold text-foreground">
                      <Clock className="w-7 h-7 text-muted-foreground" />
                      {formatTime(elapsedSeconds)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Time since emergency activation</p>
                  </div>

                  {/* Evacuation progress */}
                  <div className="max-w-md mx-auto space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-semibold text-foreground">Evacuation Progress</span>
                        <span className="font-bold text-foreground">{evacuationStats.percentEvacuated}%</span>
                      </div>
                      <div className="h-4 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${evacuationStats.percentEvacuated}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-shimmer" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                        <p className="text-2xl font-bold text-green-500">{evacuationStats.evacuated}</p>
                        <p className="text-[10px] text-green-600 font-medium">Evacuated</p>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-2xl font-bold text-amber-500">{evacuationStats.remaining}</p>
                        <p className="text-[10px] text-amber-600 font-medium">Remaining</p>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-2xl font-bold text-blue-500">{evacuationStats.total}</p>
                        <p className="text-[10px] text-blue-600 font-medium">Total</p>
                      </div>
                    </div>

                    {/* Stand Down button inside the card too */}
                    <button
                      onClick={() => setShowDeactivateDialog(true)}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-zinc-800 text-red-600 border-2 border-red-500/30 hover:border-red-500/60 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
                    >
                      <OctagonX className="w-5 h-5" />
                      STAND DOWN — End Emergency
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Response tracking panels (only when active) ── */}
            {isEmergencyActive && (
              <>
                <PeopleNeedingHelp
                  people={responseSummary.needsHelpList}
                  rescuers={responseSummary.rescuersList}
                />
                <ActiveRescuers rescuers={responseSummary.rescuersList} />
                <PeopleEvacuating evacuating={responseSummary.evacuatingList} />
                <AllResponses responses={unifiedResponses} />
              </>
            )}

            {/* ── Zone Status Grid ── */}
            <div className="section-card">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Zone Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allZones.map((zone) => {
                  const isFire = zone.zone_type === "fire_exit";
                  return (
                    <motion.div
                      key={zone.zone_id}
                      layout
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
                        zone.is_blocked && isFire
                          ? "border-red-800/40 bg-red-900/15"
                          : zone.is_blocked && !isFire
                            ? "border-red-400/25 bg-red-400/8"
                            : isFire
                              ? "border-orange-500/20 bg-orange-500/5"
                              : "border-green-500/20 bg-green-500/5"
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        zone.is_blocked && isFire
                          ? "bg-red-800 animate-pulse"
                          : zone.is_blocked && !isFire
                            ? "bg-red-400 animate-pulse"
                            : isFire
                              ? "bg-orange-500"
                              : "bg-green-500"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{zone.label}</p>
                        <p className="text-[10px] text-muted-foreground">{zone.floor === "ground" ? "Ground Floor" : "First Floor"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isFire && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-500">FIRE EXIT</span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          zone.is_blocked && isFire
                            ? "bg-red-900/20 text-red-800 dark:text-red-400"
                            : zone.is_blocked && !isFire
                              ? "bg-red-400/15 text-red-400"
                              : "bg-green-500/15 text-green-500"
                        }`}>
                          {zone.is_blocked ? "BLOCKED" : "OPEN"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Floor-by-Floor breakdown ── */}
            {isEmergencyActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="section-card"
              >
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Floor-by-Floor Evacuation
                </h3>
                <div className="space-y-3">
                  {FLOOR_STATS.map((floor) => {
                    const floorProgress = Math.min(100, evacuationStats.percentEvacuated + (Math.random() * 20 - 10));
                    const evacuatedCount = Math.floor(floor.people * Math.min(1, floorProgress / 100));
                    return (
                      <div key={floor.floor} className="p-3 rounded-xl border border-border bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-foreground">{floor.floor}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {evacuatedCount}/{floor.people} evacuated &bull; {floor.exits} exits
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, floorProgress)}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              floorProgress >= 95 ? "bg-green-500" : floorProgress >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT: Live Log + Emergency Contacts ── */}
          <div className="space-y-4">
            {/* Emergency Contacts */}
            <div className="section-card">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <PhoneCall className="w-4 h-4" />
                Emergency Contacts
              </h3>
              <div className="space-y-2">
                {EMERGENCY_CONTACTS.map((contact) => (
                  <div
                    key={contact.name}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      contact.priority === "high"
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      contact.priority === "high" ? "bg-red-500/15" : "bg-muted/40"
                    }`}>
                      <PhoneCall className={`w-4 h-4 ${contact.priority === "high" ? "text-red-500" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{contact.name}</p>
                      <p className="text-sm font-mono font-bold text-foreground">{contact.number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Event Log */}
            <div className="section-card">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4" />
                Live Event Log
                {isEmergencyActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </h3>
              {mergedLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Radio className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs">No active events</p>
                  <p className="text-[10px] mt-1">Events will appear here during emergencies</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-glass">
                  <AnimatePresence initial={false}>
                    {mergedLog.map((entry, i) => (
                      <motion.div
                        key={`${entry.time}-${i}`}
                        initial={{ opacity: 0, x: -20, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: "auto" }}
                        className={`flex gap-2 px-2.5 py-2 rounded-lg text-xs border ${
                          entry.type === "warn"
                            ? "border-amber-500/20 bg-amber-500/5"
                            : entry.type === "success"
                              ? "border-green-500/20 bg-green-500/5"
                              : "border-border bg-muted/10"
                        }`}
                      >
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5">{entry.time}</span>
                        <span className={`flex-1 font-medium ${
                          entry.type === "warn" ? "text-amber-600" : entry.type === "success" ? "text-green-600" : "text-foreground"
                        }`}>
                          {entry.message}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Activation Dialog ── */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border-2 border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Siren className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Activate Emergency?</h3>
                  <p className="text-sm text-muted-foreground">This action will lock down all fire zones</p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-foreground font-medium mb-2">The following actions will be taken:</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <TriangleAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Block all <strong>{fireExitZones.length} fire exit zones</strong> immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TriangleAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Trigger evacuation alerts across all floors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TriangleAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>Notify emergency services and building security</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={activateEmergency}
                  disabled={isActivating}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isActivating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
                  ACTIVATE NOW
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Deactivation Dialog ── */}
      <AnimatePresence>
        {showDeactivateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeactivateDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border-2 border-green-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Stand Down Emergency?</h3>
                  <p className="text-sm text-muted-foreground">This will restore normal operations</p>
                </div>
              </div>

              <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-foreground font-medium mb-2">The following will happen:</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>Unblock all {fireExitZones.length} fire exit zones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>Disable emergency alerts and alarms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>Resume normal access control operations</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeactivateDialog(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Keep Active
                </button>
                <button
                  onClick={deactivateEmergency}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  STAND DOWN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Emergency popup notification ── */}
      <AnimatePresence>
        {isEmergencyActive && !dismissedPopup && elapsedSeconds < 15 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[70] bg-red-600 text-white rounded-2xl p-5 shadow-[0_0_60px_rgba(239,68,68,0.4)] border border-red-400/30"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Siren className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-base">EMERGENCY EVACUATION</p>
                <p className="text-sm text-red-100 mt-1">
                  All personnel must evacuate immediately. Avoid blocked fire exit zones. Proceed to nearest safe exit.
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-red-200">
                  <span className="flex items-center gap-1">
                    <TriangleAlert className="w-3 h-3" />
                    {fireExitZones.length} zones blocked
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {TOTAL_BUILDING_OCCUPANCY} to evacuate
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDismissedPopup(true)}
                className="text-white/60 hover:text-white transition-colors mt-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
