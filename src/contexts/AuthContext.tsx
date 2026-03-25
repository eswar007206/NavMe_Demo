import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { AdminUser, AuthSession } from "@/lib/auth-types";

const STORAGE_KEY = "navme-demo-admin-session";
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  skipLogin: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateAvatar: (url: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSuperAdmin: false,
  login: async () => ({ success: false }),
  skipLogin: () => {},
  logout: () => {},
  refreshUser: async () => {},
  updateAvatar: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored) as AuthSession;
        return session.user;
      }
    } catch {}
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const persistSession = useCallback((adminUser: AdminUser) => {
    const session: AuthSession = { user: adminUser, loginAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const skipLogin = useCallback(() => {
    const adminUser: AdminUser = {
      id: "demo-admin",
      email: "demo@navme.com",
      display_name: "Demo Admin",
      role: "super_admin",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setUser(adminUser);
    persistSession(adminUser);
  }, [persistSession]);

  // Validate a stored session against the DB
  const validateSession = useCallback(
    async (adminId: string) => {
      // Don't validate the demo admin against the database
      if (adminId === "demo-admin") {
        return;
      }
      try {
        const { data, error } = await supabase
          .from("dashboard_admins_safe")
          .select("*")
          .eq("id", adminId)
          .single();

        if (error || !data) {
          clearSession();
          return;
        }

        const adminUser: AdminUser = data as AdminUser;
        setUser(adminUser);
        persistSession(adminUser);
      } catch {
        clearSession();
      }
    },
    [clearSession, persistSession],
  );

  // On mount: restore session from localStorage
  useEffect(() => {
    // Auth bypass: always default to demo user immediately
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (email === "demo@navme" && password === "123456") {
        const adminUser: AdminUser = {
          id: "demo-admin",
          email: "demo@navme",
          display_name: "Demo Super Admin",
          role: "super_admin",
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(adminUser);
        persistSession(adminUser);
        return { success: true };
      }

      try {
        const { data, error } = await supabase.rpc("verify_admin_login", {
          p_email: email,
          p_password: password,
        });

        if (error) {
          return { success: false, error: "Something went wrong. Please try again." };
        }
        if (!data) {
          return { success: false, error: "Invalid email or password." };
        }

        const adminUser: AdminUser = data as AdminUser;
        setUser(adminUser);
        persistSession(adminUser);
        return { success: true };
      } catch {
        return { success: false, error: "Network error. Please try again." };
      }
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    await validateSession(user.id);
  }, [user, validateSession]);

  const updateAvatar = useCallback((url: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, avatar_url: url };
      persistSession(updated);
      return updated;
    });
  }, [persistSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSuperAdmin: user?.role === "super_admin",
        login,
        skipLogin,
        logout,
        refreshUser,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
