import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuShieldOff as ShieldOff,
  LuX as X,
  LuCheck as Check,
  LuLoaderCircle as Loader2,
} from "react-icons/lu";
import { supabase } from "@/lib/supabase";

interface Room {
  room_id: string;
  room_name: string;
  floor_no: string;
  is_active: string;
}

interface RoomStatus {
  [id: string]: boolean;
}

interface Toast {
  id: number;
  roomName: string;
  active: boolean;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

async function fetchRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from("ar_rooms")
    .select("room_id, room_name, floor_no, is_active")
    .order("room_id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default function BlockShops() {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["block-rooms"],
    queryFn: fetchRooms,
    refetchInterval: 30000,
  });

  const [status, setStatus] = useState<RoomStatus>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (rooms) {
      const init: RoomStatus = {};
      rooms.forEach((r) => (init[r.room_id] = r.is_active === "Y"));
      setStatus(init);
    }
  }, [rooms]);

  const toggle = useCallback(async (roomId: string, name: string) => {
    const next = !status[roomId];
    setStatus((prev) => ({ ...prev, [roomId]: next }));

    await supabase
      .from("ar_rooms")
      .update({ is_active: next ? "Y" : "N" })
      .eq("room_id", roomId);

    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, roomName: name, active: next }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 3000);
  }, [status]);

  const activeCount = Object.values(status).filter(Boolean).length;
  const totalCount = rooms?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.5 }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-primary/25 ring-2 ring-white/10 shrink-0"
          >
            <img src="/favicon.ico" alt="NavMe" className="w-full h-full object-contain" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
              Block / Unblock Rooms
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Enable or disable rooms
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          Loading rooms...
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel p-3 sm:p-4 mb-4 sm:mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <span className="text-sm font-medium text-foreground">
                  {activeCount} Active
                </span>
              </div>
              <div className="h-4 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/50" />
                <span className="text-sm font-medium text-foreground">
                  {totalCount - activeCount} Blocked
                </span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {totalCount} total rooms
            </span>
          </motion.div>

          {/* Room cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            {rooms?.map((room) => {
              const isActive = status[room.room_id] ?? true;
              return (
                <motion.div
                  key={room.room_id}
                  variants={cardItem}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="glass-panel p-4 sm:p-5 relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-secondary/40 flex items-center justify-center p-1.5">
                        <img src="/favicon.ico" alt="NavMe" className="w-full h-full object-contain" />
                      </div>

                      <button
                        onClick={() => toggle(room.room_id, room.room_name)}
                        className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20"
                            : "bg-secondary/60"
                        }`}
                      >
                        <motion.div
                          className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm"
                          animate={{ left: isActive ? 24 : 3 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    <h3
                      className={`text-base font-bold tracking-tight transition-colors duration-300 ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {room.room_name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {room.floor_no}
                    </p>

                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                          }`}
                        />
                        {isActive ? "Active" : "Blocked"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      {/* Toast notifications */}
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
                toast.active ? "border-emerald-500/30" : "border-red-500/30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  toast.active ? "bg-emerald-500/15" : "bg-red-500/15"
                }`}
              >
                {toast.active ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldOff className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {toast.roomName}
                </p>
                <p
                  className={`text-xs font-medium ${
                    toast.active ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {toast.active ? "Room is now active" : "Room is now disabled"}
                </p>
              </div>
              <button
                onClick={() =>
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                }
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
