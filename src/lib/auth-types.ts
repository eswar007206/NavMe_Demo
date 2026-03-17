export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: "super_admin" | "admin";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: AdminUser;
  loginAt: number;
}

export type AdminRole = "super_admin" | "admin";
