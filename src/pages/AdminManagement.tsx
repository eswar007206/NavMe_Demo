import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuUserCog as UserCog,
  LuPlus as Plus,
  LuTrash2 as Trash2,
  LuLoaderCircle as Loader2,
  LuX as X,
  LuShieldCheck as ShieldCheck,
  LuUser as UserIcon,
} from "react-icons/lu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { format } from "date-fns";
import type { AdminUser, AdminRole } from "@/lib/auth-types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AdminRole>("admin");
  const [formError, setFormError] = useState("");

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admin-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_admins_safe")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as AdminUser[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_admin_account", {
        p_caller_id: user!.id,
        p_email: formEmail,
        p_password: formPassword,
        p_display_name: formName,
        p_role: formRole,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
      closeCreateForm();
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to create account");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const { error } = await supabase.rpc("delete_admin_account", {
        p_caller_id: user!.id,
        p_target_id: targetId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-list"] });
      setDeleteTarget(null);
    },
  });

  function openCreateForm() {
    setFormEmail("");
    setFormName("");
    setFormPassword("");
    setFormRole("admin");
    setFormError("");
    setShowCreate(true);
  }

  function closeCreateForm() {
    setShowCreate(false);
    setFormError("");
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (formPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    createMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Management"
        description="Manage dashboard administrator accounts"
        icon={<UserCog className="w-5 h-5 sm:w-6 sm:h-6" />}
        actions={
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreateForm}
            className="min-h-[44px] px-4 sm:px-6 rounded-xl bg-primary hover:bg-[hsl(var(--primary-hover))] text-primary-foreground font-semibold text-body flex items-center gap-2 transition-colors focus-ring"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Admin</span>
            <span className="sm:hidden">Create</span>
          </motion.button>
        }
      />

      {/* Admin list */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {!isLoading && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="font-display font-semibold text-section-title text-foreground">Administrators</h2>
            <span className="text-caption font-medium text-muted-foreground px-2.5 py-1 rounded-md bg-background/80">
              {admins.length} {admins.length === 1 ? "account" : "accounts"}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-7 h-7" />
            </motion.div>
            <span className="text-sm">Loading administrators...</span>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto scrollbar-glass">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-foreground">User</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-foreground">Email</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-foreground">Role</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-foreground">Created</th>
                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-foreground w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin, i) => {
                    const isYou = admin.id === user?.id;
                    return (
                      <motion.tr
                        key={admin.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                        className="border-b border-border/20 transition-colors group even:bg-muted/30 hover:bg-primary/[0.06]"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 rounded-lg ring-1 ring-border/30">
                              <AvatarImage src={admin.avatar_url || undefined} alt={admin.display_name} />
                              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">
                                {getInitials(admin.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-foreground font-medium">{admin.display_name}</span>
                              {isYou && (
                                <span className="ml-2 text-[10px] text-muted-foreground font-medium">(you)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-foreground/90">{admin.email}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide ${
                              admin.role === "super_admin"
                                ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                                : "bg-muted text-muted-foreground ring-1 ring-border/30"
                            }`}
                          >
                            {admin.role === "super_admin" ? (
                              <ShieldCheck className="w-3 h-3" />
                            ) : (
                              <UserIcon className="w-3 h-3" />
                            )}
                            {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-foreground/90">
                          {format(new Date(admin.created_at), "dd MMM yyyy")}
                        </td>
                        <td className="py-3.5 px-4">
                          {!isYou && (
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDeleteTarget(admin)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="sm:hidden divide-y divide-border/10">
              {admins.map((admin, i) => {
                const isYou = admin.id === user?.id;
                return (
                  <motion.div
                    key={admin.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10 rounded-xl ring-1 ring-border/30">
                        <AvatarImage src={admin.avatar_url || undefined} alt={admin.display_name} />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-xs font-bold">
                          {getInitials(admin.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {admin.display_name}
                          {isYou && <span className="ml-1 text-[10px] text-muted-foreground">(you)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{admin.email}</div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold ${
                          admin.role === "super_admin"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {admin.role === "super_admin" ? "Super" : "Admin"}
                      </span>
                    </div>
                    {!isYou && (
                      <button
                        onClick={() => setDeleteTarget(admin)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-destructive bg-destructive/10 active:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create Admin Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && closeCreateForm()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-glass shadow-2xl bg-background/80 mx-2 sm:mx-0"
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border/20">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create Admin Account</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a new administrator to the dashboard
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeCreateForm}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Display Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="glass-input w-full focus:shadow-[0_0_25px_hsla(221,83%,53%,0.1)]"
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="admin@company.com"
                    required
                    className="glass-input w-full focus:shadow-[0_0_25px_hsla(221,83%,53%,0.1)]"
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="glass-input w-full focus:shadow-[0_0_25px_hsla(221,83%,53%,0.1)]"
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Role <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as AdminRole)}
                    className="glass-input w-full"
                  >
                    <option value="admin">Admin (Read-only)</option>
                    <option value="super_admin">Super Admin (Full access)</option>
                  </select>
                </motion.div>

                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-destructive text-center font-medium"
                  >
                    {formError}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-end gap-3 pt-3 border-t border-border/10"
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={closeCreateForm}
                    className="h-10 px-5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03, boxShadow: "0 0 30px hsla(221, 83%, 53%, 0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    disabled={createMutation.isPending}
                    className="h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Account
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl bg-background/80 mx-2 sm:mx-0"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", bounce: 0.5 }}
                className="w-14 h-14 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-5"
              >
                <Trash2 className="w-6 h-6 text-destructive" />
              </motion.div>
              <h3 className="text-lg font-bold text-foreground mb-1">Remove admin?</h3>
              <p className="text-sm text-muted-foreground mb-7">
                This will permanently remove <strong>{deleteTarget.display_name}</strong> ({deleteTarget.email}). They will no longer be able to access the dashboard.
              </p>
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDeleteTarget(null)}
                  className="h-10 px-5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-destructive/20"
                >
                  {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Remove
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
