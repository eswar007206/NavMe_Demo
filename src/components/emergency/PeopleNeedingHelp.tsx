import { motion, AnimatePresence } from "framer-motion";
import { LuCircleAlert as CircleAlert, LuLifeBuoy as LifeBuoy } from "react-icons/lu";
import type { UnifiedEmergencyResponse } from "@/lib/emergency-types";
import { ABILITY_STATUS_LABELS } from "@/lib/emergency-types";

interface PeopleNeedingHelpProps {
  people: UnifiedEmergencyResponse[];
  rescuers: UnifiedEmergencyResponse[];
}

const STATUS_COLORS: Record<string, { badge: string; border: string }> = {
  pregnant: { badge: "bg-purple-500/15 text-purple-600", border: "border-purple-500/20" },
  children: { badge: "bg-blue-500/15 text-blue-600", border: "border-blue-500/20" },
  not_able_to_walk: { badge: "bg-orange-500/15 text-orange-600", border: "border-orange-500/20" },
};

export function PeopleNeedingHelp({ people, rescuers }: PeopleNeedingHelpProps) {
  const getAssignedRescuer = (personName: string) =>
    rescuers.find((r) => r.rescue_target_name === personName);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="section-card"
    >
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <CircleAlert className="w-4 h-4 text-red-500" />
        People Needing Help
        {people.length > 0 && (
          <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-500">
            {people.length}
          </span>
        )}
      </h3>

      {people.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <CircleAlert className="w-8 h-8 opacity-20 mb-2" />
          <p className="text-xs">No one currently needs assistance</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-glass">
          <AnimatePresence initial={false}>
            {people.map((person) => {
              const status = person.ability_status ?? "not_able_to_walk";
              const colors = STATUS_COLORS[status] ?? STATUS_COLORS.not_able_to_walk;
              const rescuer = getAssignedRescuer(person.user_name);
              const isAssigned = !!rescuer;

              return (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                    isAssigned
                      ? "border-amber-500/25 bg-amber-500/5"
                      : "border-red-500/25 bg-red-500/5"
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isAssigned ? "bg-amber-500" : "bg-red-500 animate-pulse"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {person.user_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{person.user_email}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>
                    {ABILITY_STATUS_LABELS[status] ?? status}
                  </span>
                  {isAssigned ? (
                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">
                      <LifeBuoy className="w-3 h-3" />
                      {rescuer.user_name}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 animate-pulse">
                      UNASSIGNED
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
