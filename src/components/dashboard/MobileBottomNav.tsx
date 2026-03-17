import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LuLayoutDashboard as LayoutDashboard,
  LuActivity as Activity,
  LuShieldCheck as ShieldCheck,
  LuChartBar as BarChart3,
  LuEllipsis as MoreHorizontal,
  LuLogOut as LogOut,
  LuUser as UserIcon,
  LuSiren as Siren,
} from "react-icons/lu";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const primaryItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: Activity, label: "Activity", path: "/user-activity" },
  { icon: ShieldCheck, label: "Access", path: "/heatmap" },
  { icon: Siren, label: "SOS", path: "/emergency" },
  { icon: MoreHorizontal, label: "Config", path: "__config__" },
];

const configItems = [
  { label: "Buildings", path: "/room-categories" },
  { label: "Floors", path: "/room-information" },
  { label: "Zones", path: "/rooms" },
  { label: "POI", path: "/pois" },
  { label: "Passages", path: "/passages" },
  { label: "Users", path: "/users" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showConfig, setShowConfig] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const isConfigActive = configItems.some((c) => location.pathname === c.path);

  function handleLogout() {
    setShowProfile(false);
    logout();
    navigate("/login");
  }

  return (
    <>
      {/* Configuration overlay */}
      {showConfig && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setShowConfig(false)}
        />
      )}

      {showConfig && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-3 right-3 z-50 glass-panel p-3 rounded-2xl md:hidden"
        >
          <p className="text-xs font-semibold text-muted-foreground px-2 pb-2">Configuration</p>
          <div className="grid grid-cols-2 gap-2">
            {configItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowConfig(false);
                  }}
                  className={`text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Profile overlay */}
      {showProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setShowProfile(false)}
        />
      )}

      {showProfile && user && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-3 right-3 z-50 glass-panel p-4 rounded-2xl md:hidden"
        >
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/20">
            <Avatar className="w-10 h-10 rounded-xl ring-1 ring-border/30">
              <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">
                {getInitials(user.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{user.display_name}</div>
              <div className="text-[11px] text-muted-foreground">{user.role === "super_admin" ? "Super Admin" : "Admin"}</div>
            </div>
          </div>

          {user.role === "super_admin" && (
            <button
              onClick={() => {
                setShowProfile(false);
                navigate("/admin-management");
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-secondary/40 transition-all flex items-center gap-2 mb-1"
            >
              <UserIcon className="w-4 h-4" />
              Admin Management
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>
      )}

      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-sidebar border-t border-border/20 safe-area-bottom">
        <div className="flex items-center justify-around px-1 h-16">
          {primaryItems.map((item) => {
            const isConfig = item.path === "__config__";
            const isActive = isConfig
              ? isConfigActive || showConfig
              : location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => {
                  if (isConfig) {
                    setShowConfig((v) => !v);
                    setShowProfile(false);
                  } else {
                    navigate(item.path);
                    setShowConfig(false);
                    setShowProfile(false);
                  }
                }}
                className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActive"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Profile button */}
          {user && (
            <button
              onClick={() => {
                setShowProfile((v) => !v);
                setShowConfig(false);
              }}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl relative"
            >
              {showProfile && (
                <motion.div
                  layoutId="mobileNavActive"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Avatar className="w-5 h-5 rounded-md">
                <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                <AvatarFallback className="rounded-md bg-primary/20 text-primary text-[8px] font-bold">
                  {getInitials(user.display_name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  showProfile ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Profile
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
