import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuUsers as Users,
  LuSearch as Search,
  LuChevronDown as ChevronDown,
  LuChevronUp as ChevronUp,
  LuCheck as Check,
  LuX as X,
  LuMapPin as MapPin,
  LuLifeBuoy as LifeBuoy,
  LuDoorOpen as DoorOpen,
  LuClock as Clock,
  LuFilter as Filter,
} from "react-icons/lu";
import { ABILITY_STATUS_LABELS, NAV_STATUS_LABELS } from "@/lib/emergency-types";
import type { UnifiedEmergencyResponse, AbilityStatus, NavigationStatus } from "@/lib/emergency-types";

interface AllResponsesProps {
  responses: UnifiedEmergencyResponse[];
}

/* ── Badge color helpers ── */

const ABILITY_COLORS: Record<string, string> = {
  physically_abled: "bg-green-500/15 text-green-600",
  pregnant: "bg-purple-500/15 text-purple-600",
  children: "bg-blue-500/15 text-blue-600",
  not_able_to_walk: "bg-orange-500/15 text-orange-600",
};

const NAV_COLORS: Record<string, string> = {
  pending: "bg-zinc-500/15 text-zinc-500",
  navigating_to_exit: "bg-amber-500/15 text-amber-600",
  navigating_to_rescue: "bg-blue-500/15 text-blue-600",
  waiting_for_help: "bg-red-500/15 text-red-500",
  reached_exit: "bg-green-500/15 text-green-600",
  reached_person: "bg-teal-500/15 text-teal-600",
  rescued: "bg-emerald-500/15 text-emerald-600",
};

const CHOICE_LABELS: Record<string, { label: string; icon: typeof DoorOpen; color: string }> = {
  exit: { label: "Exit", icon: DoorOpen, color: "bg-amber-500/15 text-amber-600" },
  save_someone: { label: "Rescue", icon: LifeBuoy, color: "bg-blue-500/15 text-blue-600" },
  safe_place: { label: "Safe Place", icon: Check, color: "bg-green-500/15 text-green-600" },
  stuck: { label: "Stuck", icon: X, color: "bg-red-500/15 text-red-600" },
};

type FilterTab = "all" | "acknowledged" | "needs_help" | "evacuating" | "rescuers" | "safe";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "acknowledged", label: "Acknowledged" },
  { key: "needs_help", label: "Needs Help" },
  { key: "evacuating", label: "Evacuating" },
  { key: "rescuers", label: "Rescuers" },
  { key: "safe", label: "Safe" },
];

export function AllResponses({ responses }: AllResponsesProps) {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  /* ── Filter + search ── */
  const filtered = useMemo(() => {
    let list = responses;

    // Tab filter
    switch (filterTab) {
      case "acknowledged":
        list = list.filter((r) => r.acknowledged && !r.ability_status);
        break;
      case "needs_help":
        list = list.filter(
          (r) =>
            r.ability_status !== "physically_abled" &&
            r.ability_status !== null &&
            (r.navigation_status === "waiting_for_help" || r.navigation_status === "rescued")
        );
        break;
      case "evacuating":
        list = list.filter(
          (r) =>
            r.navigation_status === "navigating_to_exit" ||
            r.navigation_status === "reached_exit"
        );
        break;
      case "rescuers":
        list = list.filter((r) => r.choice === "save_someone");
        break;
      case "safe":
        list = list.filter(
          (r) => r.navigation_status === "reached_exit" || r.navigation_status === "rescued" || r.navigation_status === "safe_place"
        );
        break;
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.user_name.toLowerCase().includes(q) ||
          r.user_email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [responses, filterTab, search]);

  const formatTime = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatCoord = (n: number | null | undefined) => {
    if (n === null || n === undefined) return "—";
    return Number(n).toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-card"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          All User Responses
          <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500">
            {responses.length}
          </span>
        </h3>

        {/* Search */}
        <div className="sm:ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              filterTab === tab.key
                ? "bg-indigo-500/15 text-indigo-600 border border-indigo-500/30"
                : "bg-muted/30 text-muted-foreground border border-transparent hover:bg-muted/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Response list ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Filter className="w-8 h-8 opacity-20 mb-2" />
          <p className="text-xs">No responses match this filter</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-glass">
          <AnimatePresence initial={false}>
            {filtered.map((r) => {
              const isExpanded = expandedId === r.id;
              const abilityColor = ABILITY_COLORS[r.ability_status ?? ""] ?? "bg-muted text-muted-foreground";
              const navColor = NAV_COLORS[r.navigation_status] ?? "bg-muted text-muted-foreground";
              const choiceInfo = r.choice ? CHOICE_LABELS[r.choice] : null;

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-xl border border-border bg-card/50 overflow-hidden"
                >
                  {/* ── Row (always visible) ── */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/20 transition-colors"
                  >
                    {/* Acknowledged indicator */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        r.acknowledged ? "bg-green-500" : "bg-zinc-400 animate-pulse"
                      }`}
                    />

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {r.user_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {r.user_email}
                      </p>
                    </div>

                    {/* Ability badge */}
                    {r.ability_status && (
                      <span className={`hidden sm:inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded ${abilityColor}`}>
                        {ABILITY_STATUS_LABELS[r.ability_status as AbilityStatus] ?? r.ability_status}
                      </span>
                    )}

                    {/* Choice badge */}
                    {choiceInfo && (
                      <span className={`hidden sm:inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${choiceInfo.color}`}>
                        <choiceInfo.icon className="w-3 h-3" />
                        {choiceInfo.label}
                      </span>
                    )}

                    {/* Nav status badge */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${navColor}`}>
                      {NAV_STATUS_LABELS[r.navigation_status as NavigationStatus] ?? r.navigation_status}
                    </span>

                    {/* Expand arrow */}
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* ── Expanded details ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-border">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            {/* Acknowledged */}
                            <DetailItem
                              label="Acknowledged"
                              value={
                                r.acknowledged ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <Check className="w-3 h-3" /> Yes
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-500">
                                    <X className="w-3 h-3" /> No
                                  </span>
                                )
                              }
                            />
                            <DetailItem
                              label="Acknowledged At"
                              icon={<Clock className="w-3 h-3" />}
                              value={formatTime(r.acknowledged_at)}
                            />
                            <DetailItem
                              label="Ability Status"
                              value={
                                r.ability_status ? (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${abilityColor}`}>
                                    {ABILITY_STATUS_LABELS[r.ability_status as AbilityStatus] ?? r.ability_status}
                                  </span>
                                ) : (
                                  "—"
                                )
                              }
                            />
                            <DetailItem
                              label="Choice"
                              value={
                                choiceInfo ? (
                                  <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${choiceInfo.color}`}>
                                    <choiceInfo.icon className="w-3 h-3" />
                                    {choiceInfo.label}
                                  </span>
                                ) : (
                                  "—"
                                )
                              }
                            />
                            <DetailItem
                              label="Nav Status"
                              value={
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${navColor}`}>
                                  {NAV_STATUS_LABELS[r.navigation_status as NavigationStatus] ?? r.navigation_status}
                                </span>
                              }
                            />
                            <DetailItem
                              label="Position"
                              icon={<MapPin className="w-3 h-3" />}
                              value={`(${formatCoord(r.pos_x)}, ${formatCoord(r.pos_y)}, ${formatCoord(r.pos_z)})`}
                            />
                            
                            {/* Stuck Description */}
                            {r.source === "stuck" && r.issue_description && (
                              <div className="col-span-full">
                                <DetailItem
                                  label="Issue Description"
                                  value={r.issue_description}
                                />
                              </div>
                            )}

                            {/* Rescue info */}
                            {r.rescue_target_name && (
                              <>
                                <DetailItem
                                  label="Rescue Target"
                                  icon={<LifeBuoy className="w-3 h-3" />}
                                  value={r.rescue_target_name}
                                />
                                <DetailItem
                                  label="Target Status"
                                  value={
                                    r.rescue_target_status
                                      ? ABILITY_STATUS_LABELS[r.rescue_target_status as AbilityStatus] ?? r.rescue_target_status
                                      : "—"
                                  }
                                />
                              </>
                            )}

                            {/* Timestamps */}
                            <DetailItem
                              label="Created"
                              icon={<Clock className="w-3 h-3" />}
                              value={formatTime(r.created_at)}
                            />
                            <DetailItem
                              label="Last Updated"
                              icon={<Clock className="w-3 h-3" />}
                              value={formatTime(r.updated_at)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

/* ── Tiny detail subcomponent ── */

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-2 rounded-lg bg-muted/20 border border-border/50">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="text-[11px] font-semibold text-foreground">{value}</div>
    </div>
  );
}
