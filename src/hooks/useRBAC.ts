import { useAuth } from "@/contexts/AuthContext";

export function useRBAC() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  return {
    canWrite: isSuperAdmin,
    canManageAdmins: isSuperAdmin,
    canUploadAvatar: isSuperAdmin,
    role: user?.role ?? null,
  };
}
