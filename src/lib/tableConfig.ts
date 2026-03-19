export interface ColumnConfig {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "datetime" | "boolean" | "select" | "textarea";
  required?: boolean;
  editable?: boolean;
  showInTable?: boolean;
  showInForm?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

export interface TableConfig {
  tableName: string;
  displayName: string;
  description: string;
  primaryKey: string;
  columns: ColumnConfig[];
  defaultSort?: { key: string; direction: "asc" | "desc" };
}

export const tableConfigs: Record<string, TableConfig> = {
  ar_ropin_buildings: {
    tableName: "ar_ropin_buildings",
    displayName: "Buildings",
    description: "Stadiums, airports, and major venue structures",
    primaryKey: "id",
    defaultSort: { key: "created_at", direction: "asc" },
    columns: [
      { key: "id", label: "ID", type: "text", editable: false, showInTable: true, showInForm: false },
      { key: "name", label: "Building Name", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "e.g. Main Block" },
      { key: "name_display", label: "Display Name", type: "text", editable: true, showInTable: true, showInForm: true, placeholder: "Name shown in Access Control" },
      { key: "description", label: "Description", type: "textarea", editable: true, showInTable: true, showInForm: true, placeholder: "Describe this building" },
      { key: "is_active", label: "Active", type: "boolean", editable: true, showInTable: true, showInForm: true, defaultValue: true },
      { key: "created_at", label: "Created On", type: "datetime", editable: false, showInTable: true, showInForm: false },
    ],
  },

  ar_ropin_floors: {
    tableName: "ar_ropin_floors",
    displayName: "Floors",
    description: "Levels and tiers within venue structures",
    primaryKey: "id",
    defaultSort: { key: "floor_level", direction: "asc" },
    columns: [
      { key: "id", label: "ID", type: "text", editable: false, showInTable: false, showInForm: false },
      { key: "floor_name", label: "Floor Name", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "e.g. Ground Floor" },
      { key: "name_display", label: "Display Name", type: "text", editable: true, showInTable: true, showInForm: true, placeholder: "Name shown in Access Control" },
      { key: "floor_level", label: "Level", type: "number", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "0" },
      { key: "building_id", label: "Building ID", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "Building UUID" },
      { key: "status", label: "Status", type: "select", editable: true, showInTable: true, showInForm: true, defaultValue: "OPEN", options: [{ value: "OPEN", label: "Open" }, { value: "BLOCKED", label: "Blocked" }, { value: "RESTRICTED", label: "Restricted" }] },
      { key: "weight_factor", label: "Weight Factor", type: "number", editable: true, showInTable: true, showInForm: true, defaultValue: 1 },
      { key: "is_active", label: "Active", type: "boolean", editable: true, showInTable: true, showInForm: true, defaultValue: true },
      { key: "created_at", label: "Created On", type: "datetime", editable: false, showInTable: true, showInForm: false },
    ],
  },

  ar_ropin_zones: {
    tableName: "ar_ropin_zones",
    displayName: "Zones",
    description: "Designated areas — concourses, gates, lounges",
    primaryKey: "id",
    defaultSort: { key: "created_at", direction: "asc" },
    columns: [
      { key: "id", label: "ID", type: "text", editable: false, showInTable: false, showInForm: false },
      { key: "zone_name", label: "Zone Name", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "e.g. Lobby" },
      { key: "name_display", label: "Display Name", type: "text", editable: true, showInTable: true, showInForm: true, placeholder: "Name shown in Access Control" },
      { key: "floor_id", label: "Floor ID", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "Floor UUID" },
      { key: "status", label: "Status", type: "select", editable: true, showInTable: true, showInForm: true, defaultValue: "OPEN", options: [{ value: "OPEN", label: "Open" }, { value: "BLOCKED", label: "Blocked" }, { value: "RESTRICTED", label: "Restricted" }] },
      { key: "weight_factor", label: "Weight Factor", type: "number", editable: true, showInTable: true, showInForm: true, defaultValue: 1 },
      { key: "is_active", label: "Active", type: "boolean", editable: true, showInTable: true, showInForm: true, defaultValue: true },
      { key: "created_at", label: "Created On", type: "datetime", editable: false, showInTable: true, showInForm: false },
    ],
  },

  ar_ropin_pois: {
    tableName: "ar_ropin_pois",
    displayName: "POI",
    description: "Key points of interest across venues",
    primaryKey: "id",
    defaultSort: { key: "created_at", direction: "asc" },
    columns: [
      { key: "id", label: "ID", type: "text", editable: false, showInTable: false, showInForm: false },
      { key: "poi_name", label: "POI Name", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "e.g. Conference Room A" },
      { key: "poi_type", label: "Type", type: "text", editable: true, showInTable: true, showInForm: true, placeholder: "e.g. Office, Lab" },
      { key: "icon_url", label: "Icon URL", type: "text", editable: true, showInTable: false, showInForm: true, placeholder: "https://..." },
      { key: "pos_x", label: "Position X", type: "number", editable: true, showInTable: true, showInForm: true, placeholder: "0" },
      { key: "pos_y", label: "Position Y", type: "number", editable: true, showInTable: true, showInForm: true, placeholder: "0" },
      { key: "pos_z", label: "Position Z", type: "number", editable: true, showInTable: true, showInForm: true, placeholder: "0" },
      { key: "show_in_ar", label: "Show in AR", type: "boolean", editable: true, showInTable: true, showInForm: true, defaultValue: true },
      { key: "is_active", label: "Active", type: "boolean", editable: true, showInTable: true, showInForm: true, defaultValue: true },
      { key: "created_at", label: "Created On", type: "datetime", editable: false, showInTable: true, showInForm: false },
    ],
  },

  ar_ropin_entries: {
    tableName: "ar_ropin_entries",
    displayName: "Passages",
    description: "Gates, doors, and entry points between areas",
    primaryKey: "id",
    defaultSort: { key: "created_at", direction: "asc" },
    columns: [
      { key: "id", label: "ID", type: "text", editable: false, showInTable: false, showInForm: false },
      { key: "entry_name", label: "Passage Name", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "e.g. Main Entrance" },
      { key: "name_display", label: "Display Name", type: "text", editable: true, showInTable: true, showInForm: true, placeholder: "Name shown in Access Control" },
      { key: "entry_type", label: "Type", type: "text", editable: true, showInTable: true, showInForm: true, placeholder: "e.g. Door, Gate" },
      { key: "building_id", label: "Building ID", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "Building UUID" },
      { key: "floor_id", label: "Floor ID", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "Floor UUID" },
      { key: "pos_x", label: "Position X", type: "number", editable: true, showInTable: true, showInForm: true, placeholder: "0" },
      { key: "pos_y", label: "Position Y", type: "number", editable: true, showInTable: true, showInForm: true, placeholder: "0" },
      { key: "pos_z", label: "Position Z", type: "number", editable: true, showInTable: true, showInForm: true, placeholder: "0" },
      { key: "is_active", label: "Active", type: "boolean", editable: true, showInTable: true, showInForm: true, defaultValue: true },
      { key: "created_at", label: "Created On", type: "datetime", editable: false, showInTable: true, showInForm: false },
    ],
  },

  ar_ropin_users: {
    tableName: "ar_ropin_users",
    displayName: "Users",
    description: "Personnel and visitors in the facility network",
    primaryKey: "id",
    defaultSort: { key: "created_at", direction: "desc" },
    columns: [
      { key: "id", label: "ID", type: "text", editable: false, showInTable: false, showInForm: false },
      { key: "full_name", label: "Full Name", type: "text", editable: true, showInTable: true, showInForm: true, placeholder: "Display name" },
      { key: "email", label: "Email", type: "text", required: true, editable: true, showInTable: true, showInForm: true, placeholder: "user@example.com" },
      { key: "role", label: "Role", type: "select", editable: true, showInTable: true, showInForm: true, defaultValue: "USER", options: [{ value: "USER", label: "User" }, { value: "ADMIN", label: "Admin" }] },
      { key: "share_enabled", label: "Share Enabled", type: "text", editable: true, showInTable: true, showInForm: true, placeholder: "Y or N" },
      { key: "is_active", label: "Active", type: "boolean", editable: true, showInTable: true, showInForm: true, defaultValue: true },
      { key: "created_at", label: "Joined On", type: "datetime", editable: false, showInTable: true, showInForm: false },
    ],
  },
};

export const tableOrder = [
  "ar_ropin_buildings",
  "ar_ropin_floors",
  "ar_ropin_zones",
  "ar_ropin_pois",
  "ar_ropin_entries",
  "ar_ropin_users",
] as const;
