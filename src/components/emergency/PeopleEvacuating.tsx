import { motion, AnimatePresence } from "framer-motion";
import { LuFootprints as Footprints, LuShieldCheck as ShieldCheck } from "react-icons/lu";
import type { UnifiedEmergencyResponse } from "@/lib/emergency-types";
import { ABILITY_STATUS_LABELS } from "@/lib/emergency-types";

interface PeopleEvacuatingProps {
  evacuating: UnifiedEmergencyResponse[];
}

export function PeopleEvacuating({ evacuating }: PeopleEvacuatingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-card"
    >
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Footprints className="w-4 h-4 text-amber-500" />
        People Evacuating
        {evacuating.length > 0 && (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
            {evacuating.length}
          </span>
        )}
      </h3>

      {evacuating.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Footprints className="w-8 h-8 opacity-20 mb-2" />
          <p className="text-xs">No one currently evacuating</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[260px] overflow-y-auto scrollbar-glass">
          <AnimatePresence initial={false}>
            {evacuating.map((person) => {
              const reachedExit = person.navigation_status === "reached_exit";
              return (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                    reachedExit
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-amber-500/20 bg-amber-500/5"
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    reachedExit ? "bg-green-500" : "bg-amber-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {person.user_name}
                    </p>
                    {person.ability_status && person.ability_status !== "physically_abled" && (
                      <p className="text-[10px] text-muted-foreground">
                        {ABILITY_STATUS_LABELS[person.ability_status]}
                      </p>
                    )}
                  </div>
                  {reachedExit ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/15 text-green-600">
                      <ShieldCheck className="w-3 h-3" />
                      SAFE
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">
                      EN ROUTE
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
