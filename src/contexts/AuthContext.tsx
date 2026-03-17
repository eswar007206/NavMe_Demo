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

const STORAGE_KEY = "pinnacle-admin-session";
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isSuperAdmin: false,
  login: async () => ({ success: false }),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((adminUser: AdminUser) => {
    const session: AuthSession = { user: adminUser, loginAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Validate a stored session against the DB
  const validateSession = useCallback(
    async (adminId: string) => {
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const session: AuthSession = JSON.parse(stored);
      if (Date.now() - session.loginAt > SESSION_MAX_AGE) {
        clearSession();
        setIsLoading(false);
        return;
      }
      // Optimistically set user, then validate
      setUser(session.user);
      validateSession(session.user.id).finally(() => setIsLoading(false));
    } catch {
      clearSession();
      setIsLoading(false);
    }
  }, [clearSession, validateSession]);

  const login = useCallback(
    async (email: string, password: string) => {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSuperAdmin: user?.role === "super_admin",
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
