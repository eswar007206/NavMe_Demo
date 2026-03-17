import { motion } from "framer-motion";
import {
  LuCheck as CheckCircle,
  LuCircleAlert as CircleAlert,
  LuLifeBuoy as LifeBuoy,
  LuFootprints as Footprints,
  LuShieldCheck as ShieldCheck,
} from "react-icons/lu";

interface ResponseSummaryCardsProps {
  acknowledged: number;
  total: number;
  needsHelp: number;
  rescuersActive: number;
  evacuating: number;
  reachedExit: number;
}

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

export function ResponseSummaryCards({
  acknowledged,
  total,
  needsHelp,
  rescuersActive,
  evacuating,
  reachedExit,
}: ResponseSummaryCardsProps) {
  const cards = [
    {
      label: "Acknowledged",
      value: `${acknowledged}/${total}`,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/15",
    },
    {
      label: "Needs Help",
      value: needsHelp,
      icon: CircleAlert,
      color: "text-red-500",
      bg: "bg-red-500/15",
      pulse: needsHelp > 0,
    },
    {
      label: "Rescuers Active",
      value: rescuersActive,
      icon: LifeBuoy,
      color: "text-blue-500",
      bg: "bg-blue-500/15",
    },
    {
      label: "Evacuating",
      value: evacuating,
      icon: Footprints,
      color: "text-amber-500",
      bg: "bg-amber-500/15",
    },
    {
      label: "Reached Safety",
      value: reachedExit,
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/15",
    },
  ];

  return (
    <motion.div {...fade} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="section-card flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
            <c.icon className={`w-5 h-5 ${c.color} ${c.pulse ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
