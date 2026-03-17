/** Shared types for the Emergency SOS response tracking system. */

export interface EmergencyStuckReport {
  id: string;
  emergency_id: string;
  user_email: string;
  user_name: string;
  pos_x: number | null;
  pos_y: number | null;
  pos_z: number | null;
  issue_description: string | null;
  status: string; // "pending", "rescued", "waiting_for_help"
  created_at: string;
  updated_at: string;
}

export interface EmergencyCheckin {
  id: string;
  emergency_id: string;
  user_email: string;
  user_name: string;
  is_physically_able: boolean;
  is_in_safe_place: boolean;
  pos_x: number | null;
  pos_y: number | null;
  pos_z: number | null;
  status: string; // "recorded", "safe"
  created_at: string;
  updated_at: string;
}

/** 
 * A unified type used by the dashboard UI to merge stuck reports and checkins
 * into a single list for the "All Responses" table and sub-components.
 */
export interface UnifiedEmergencyResponse {
  id: string;
  source: "stuck" | "checkin";
  user_email: string;
  user_name: string;
  pos_x: number | null;
  pos_y: number | null;
  pos_z: number | null;
  created_at: string;
  updated_at: string;
  
  // Mapped fields for UI compatibility with older code
  acknowledged: boolean;
  acknowledged_at: string | null;
  ability_status: "physically_abled" | "not_able_to_walk" | "pregnant" | "children" | null;
  choice: "exit" | "save_someone" | "safe_place" | "stuck" | null;
  navigation_status: string;
  issue_description?: string;
  rescue_target_name?: string | null;
  rescue_target_status?: string | null;
}

export type AbilityStatus = "physically_abled" | "pregnant" | "children" | "not_able_to_walk";
export type EmergencyChoice = "exit" | "save_someone" | "safe_place" | "stuck";
export type NavigationStatus =
  | "pending"
  | "navigating_to_exit"
  | "navigating_to_rescue"
  | "waiting_for_help"
  | "reached_exit"
  | "reached_person"
  | "rescued"
  | "safe_place"
  | "stuck";

export const ABILITY_STATUS_LABELS: Record<string, string> = {
  physically_abled: "Physically Abled",
  pregnant: "Pregnant",
  children: "Has Children",
  not_able_to_walk: "Cannot Walk",
};

export const NAV_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  navigating_to_exit: "Heading to Exit",
  navigating_to_rescue: "Going to Rescue",
  waiting_for_help: "Waiting for Help",
  reached_exit: "Reached Exit",
  reached_person: "Reached Person",
  rescued: "Rescued",
  safe_place: "In Safe Place",
  stuck: "Stuck / Needing Help",
  recorded: "Recorded"
};
