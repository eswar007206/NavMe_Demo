import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { LuSiren as Siren, LuOctagonX as OctagonX } from "react-icons/lu";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { supabase } from "@/lib/supabase";

const EMERGENCY_ROW_ID = "00000000-0000-0000-0000-000000000001";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: emergencyState } = useQuery({
    queryKey: ["emergency-state"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_state")
        .select("*")
        .eq("id", EMERGENCY_ROW_ID)
        .single();
      if (error) return null;
      return data as { is_active: boolean; activated_at: string | null };
    },
    refetchInterval: 3000,
  });

  const isEmergencyActive = emergencyState?.is_active ?? false;
  const isOnEmergencyPage = location.pathname === "/emergency";

  return (
    <div className="flex flex-col h-[100dvh] w-full min-w-0 bg-background transition-colors duration-500 overflow-hidden">
      <div className="gradient-mesh" aria-hidden />

      {/* ── Global emergency banner (visible on all pages except /emergency) ── */}
      <AnimatePresence>
        {isEmergencyActive && !isOnEmergencyPage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0 relative z-50"
          >
            <div className="bg-red-600 text-white px-4 py-2.5 flex items-center gap-3 animate-emergency-banner">
              <Siren className="w-4 h-4 animate-spin shrink-0" />
              <p className="text-xs font-bold flex-1">
                EMERGENCY ACTIVE — Fire exit zones are locked down. Evacuation in progress.
              </p>
              <button
                onClick={() => navigate("/emergency")}
                className="px-3 py-1.5 bg-white text-red-700 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors shrink-0"
              >
                View Emergency
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Red pulse overlay when emergency is active ── */}
      <AnimatePresence>
        {isEmergencyActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] pointer-events-none"
            style={{ mixBlendMode: "multiply" }}
          >
            <div className="absolute inset-0 animate-emergency-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0">
        <div className="hidden md:block shrink-0">
          <DashboardSidebar />
        </div>
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-w-0 relative z-10 bg-background pb-24 md:pb-8 overflow-y-auto overflow-x-hidden scrollbar-glass"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 w-full">
            <Outlet />
          </div>
        </motion.main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
