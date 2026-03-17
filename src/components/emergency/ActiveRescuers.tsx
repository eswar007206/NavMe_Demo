import { motion, AnimatePresence } from "framer-motion";
import { LuLifeBuoy as LifeBuoy, LuArrowRight as ArrowRight } from "react-icons/lu";
import type { UnifiedEmergencyResponse } from "@/lib/emergency-types";
import { ABILITY_STATUS_LABELS, NAV_STATUS_LABELS } from "@/lib/emergency-types";

interface ActiveRescuersProps {
  rescuers: UnifiedEmergencyResponse[];
}

const NAV_BADGE: Record<string, string> = {
  navigating_to_rescue: "bg-amber-500/15 text-amber-600",
  reached_person: "bg-green-500/15 text-green-600",
  pending: "bg-muted text-muted-foreground",
};

export function ActiveRescuers({ rescuers }: ActiveRescuersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-card"
    >
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <LifeBuoy className="w-4 h-4 text-blue-500" />
        Active Rescuers
        {rescuers.length > 0 && (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
            {rescuers.length}
          </span>
        )}
      </h3>

      {rescuers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <LifeBuoy className="w-8 h-8 opacity-20 mb-2" />
          <p className="text-xs">No active rescuers</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-glass">
          <AnimatePresence initial={false}>
            {rescuers.map((r) => {
              const navColor = NAV_BADGE[r.navigation_status] ?? NAV_BADGE.pending;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5"
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{r.user_name}</p>
                    {r.rescue_target_name && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        {r.rescue_target_name}
                        {r.rescue_target_status && (
                          <span className="text-[9px] opacity-70">
                            ({ABILITY_STATUS_LABELS[r.rescue_target_status as keyof typeof ABILITY_STATUS_LABELS] ?? r.rescue_target_status})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${navColor}`}>
                    {NAV_STATUS_LABELS[r.navigation_status] ?? r.navigation_status}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
