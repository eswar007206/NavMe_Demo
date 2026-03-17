import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LuLayoutDashboard as LayoutDashboard,
  LuBuilding2 as Building2,
  LuLayers as Layers,
  LuLayoutGrid as LayoutGrid,
  LuMapPin as MapPin,
  LuDoorOpen as DoorOpen,
  LuUsers as Users,
  LuActivity as Activity,
  LuShieldCheck as ShieldCheck,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuChevronDown as ChevronDown,
  LuSettings as Settings,
  LuPencil as Pencil,
  LuLogOut as LogOut,
  LuUserCog as UserCog,
  LuChartBar as BarChart3,
  LuSiren as Siren,
} from "react-icons/lu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarUpload } from "@/components/auth/AvatarUpload";

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
};

type NavGroup = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  children: NavItem[];
};

const SIDEBAR_STORAGE_KEY = "pinnacle-sidebar-open";

const baseNavStructure: (NavItem | NavGroup)[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Activity, label: "User Activity", path: "/user-activity" },
  { icon: ShieldCheck, label: "Access Control", path: "/heatmap" },
  { icon: Pencil, label: "Zone Editor", path: "/zone-editor" },
  { icon: Siren, label: "Emergency SOS", path: "/emergency" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  {
    icon: Settings,
    label: "Configuration",
    children: [
      { icon: Building2, label: "Buildings", path: "/room-categories" },
      { icon: Layers, label: "Floors", path: "/room-information" },
      { icon: LayoutGrid, label: "Zones", path: "/rooms" },
      { icon: MapPin, label: "POI", path: "/pois" },
      { icon: DoorOpen, label: "Passages", path: "/passages" },
      { icon: Users, label: "Users", path: "/users" },
    ],
  },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "children" in item && Array.isArray((item as NavGroup).children);
}

function isPathInGroup(group: NavGroup, pathname: string): boolean {
  return group.children.some((c) => c.path === pathname);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isSuperAdmin } = useAuth();

  const navStructure = useMemo(() => {
    const items = [...baseNavStructure];
    if (isSuperAdmin) {
      items.push({ icon: UserCog, label: "Admin Management", path: "/admin-management" });
    }
    return items;
  }, [isSuperAdmin]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (raw) setOpenGroups(JSON.parse(raw));
    } catch {
      const initial: Record<string, boolean> = {};
      navStructure.forEach((item, i) => {
        if (isGroup(item) && isPathInGroup(item, location.pathname)) {
          initial[`group-${i}`] = true;
        }
      });
      if (Object.keys(initial).length > 0) setOpenGroups(initial);
    }
  }, []);

  useEffect(() => {
    navStructure.forEach((item, i) => {
      if (isGroup(item) && isPathInGroup(item, location.pathname)) {
        setOpenGroups((prev) => ({ ...prev, [`group-${i}`]: true }));
      }
    });
  }, [location.pathname, navStructure]);

  const setGroupOpen = (key: string, open: boolean) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: open };
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const sidebarBg = "bg-[hsl(var(--sidebar-background))]";
  const textNorm = "text-[hsl(var(--sidebar-foreground))]";
  const textMuted = "text-white/60";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`${sidebarBg} border-r border-white/10 h-full shrink-0 flex flex-col transition-all duration-500 ease-out ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* Profile / Avatar section */}
      <div className="border-b border-white/10 px-3 py-4">
        {user ? (
          <div className="flex items-center gap-3 px-2 py-2">
            {isSuperAdmin ? (
              <AvatarUpload
                currentUrl={user.avatar_url}
                displayName={user.display_name}
                adminId={user.id}
                size="w-10 h-10"
              />
            ) : (
              <Avatar className="w-10 h-10 rounded-xl ring-2 ring-white/10 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                <AvatarFallback className="rounded-xl bg-primary/20 text-primary text-xs font-bold">
                  {getInitials(user.display_name)}
                </AvatarFallback>
              </Avatar>
            )}
            {!collapsed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex-1 min-w-0 text-left rounded-lg px-2 py-1 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
                    <div className={`text-sm font-semibold truncate ${textNorm}`}>
                      {user.display_name}
                    </div>
                    <div className="text-[10px] text-white/40 font-medium">
                      {user.role === "super_admin" ? "Super Admin" : "Admin"}
                    </div>
                  </button>
                </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isSuperAdmin && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/admin-management")}>
                    <UserCog className="w-4 h-4 mr-2" />
                    Admin Management
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden ring-2 ring-white/10">
              <img src="/favicon.ico" alt="Pinnacle" className="w-full h-full object-contain" />
            </div>
            {!collapsed && (
              <span className={`text-lg font-bold tracking-tight ${textNorm}`}>Pinnacle</span>
            )}
          </div>
        )}
      </div>


      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-glass">
        {navStructure.map((item, i) => {
          if (!isGroup(item)) {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                  isActive
                    ? "bg-white/15 text-white"
                    : `${textMuted} hover:bg-white/10 hover:text-white`
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            );
          }

          const groupKey = `group-${i}`;
          const isOpen = openGroups[groupKey] ?? false;
          const hasActiveChild = isPathInGroup(item, location.pathname);

          const firstPath = item.children[0]?.path;
          return (
            <Collapsible
              key={item.label}
              open={collapsed ? false : isOpen}
              onOpenChange={(open) => setGroupOpen(groupKey, open)}
            >
              <CollapsibleTrigger asChild>
                <button
                  onClick={(e) => {
                    if (collapsed && firstPath) {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(firstPath);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                    hasActiveChild ? "text-white" : `${textMuted} hover:bg-white/10 hover:text-white`
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.span>
                    </>
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {!collapsed &&
                  item.children.map((child) => {
                    const isActive = location.pathname === child.path;
                    return (
                      <button
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        className={`w-full flex items-center gap-3 pl-4 pr-4 py-2 min-h-[44px] rounded-lg text-sm font-medium transition-colors ml-2 border-l-2 border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                          isActive
                            ? "border-white bg-white/10 text-white"
                            : `${textMuted} hover:bg-white/5 hover:text-white border-transparent`
                        }`}
                      >
                        <child.icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span className="truncate">{child.label}</span>
                      </button>
                    );
                  })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg ${textMuted} hover:bg-white/10 hover:text-white transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30`}
        >
          <motion.span animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.35 }}>
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </motion.span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
