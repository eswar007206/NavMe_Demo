import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuPlus as Plus,
  LuPencil as Pencil,
  LuTrash2 as Trash2,
  LuRefreshCw as RefreshCw,
  LuSearch as Search,
  LuChevronLeft as ChevronLeft,
  LuChevronRight as ChevronRight,
  LuX as X,
  LuLoaderCircle as Loader2,
  LuCircleAlert as AlertCircle,
} from "react-icons/lu";
import type { TableConfig, ColumnConfig } from "@/lib/tableConfig";
import { useTableData } from "@/hooks/useTableData";
import { useRBAC } from "@/hooks/useRBAC";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DataTableProps {
  config: TableConfig;
}

const PAGE_SIZE = 15;

function formatCellValue(value: unknown, col: ColumnConfig): string {
  if (value === null || value === undefined) return "—";
  if (col.type === "datetime" && typeof value === "string") {
    try {
      return format(new Date(value), "dd MMM yyyy, HH:mm");
    } catch {
      return String(value);
    }
  }
  if (col.type === "date" && typeof value === "string") {
    try {
      return format(new Date(value), "dd MMM yyyy");
    } catch {
      return String(value);
    }
  }
  if (col.type === "select" && col.options) {
    const opt = col.options.find((o) => o.value === value);
    return opt ? opt.label : String(value);
  }
  return String(value);
}

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    Yes: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20",
    No: "bg-red-500/15 text-red-400 ring-1 ring-red-500/20",
    Y: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20",
    N: "bg-red-500/15 text-red-400 ring-1 ring-red-500/20",
    PENDING: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20",
    ACCEPTED: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20",
    REJECTED: "bg-red-500/15 text-red-400 ring-1 ring-red-500/20",
    EXPIRED: "bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20",
  };
  const cls = colors[value] || "bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/20";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide ${cls}`}>
      {value}
    </span>
  );
}

const isStatusCol = (col: ColumnConfig) =>
  col.key === "is_active" || col.key === "is_available" || col.key === "share_enabled";

export default function DataTable({ config }: DataTableProps) {
  const {
    data, isLoading, error, refetch,
    insert, update, remove,
    isInserting, isUpdating, isDeleting,
  } = useTableData(config);

  const { canWrite } = useRBAC();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<unknown | null>(null);

  const tableCols = config.columns.filter((c) => c.showInTable);
  const formCols = config.columns.filter((c) => c.showInForm);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      tableCols.some((col) => {
        const val = row[col.key];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, tableCols]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function openAddForm() {
    setEditingRow(null);
    const defaults: Record<string, unknown> = {};
    formCols.forEach((col) => {
      if (col.defaultValue !== undefined) defaults[col.key] = col.defaultValue;
    });
    setFormData(defaults);
    setShowForm(true);
  }

  function openEditForm(row: Record<string, unknown>) {
    setEditingRow(row);
    const vals: Record<string, unknown> = {};
    formCols.forEach((col) => { vals[col.key] = row[col.key] ?? ""; });
    setFormData(vals);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingRow(null);
    setFormData({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    formCols.forEach((col) => {
      const val = formData[col.key];
      if (val === "" || val === undefined) {
        if (!col.required) cleaned[col.key] = null;
      } else {
        cleaned[col.key] = val;
      }
    });
    if (editingRow) {
      await update({ id: editingRow[config.primaryKey], updates: cleaned });
    } else {
      await insert(cleaned);
    }
    closeForm();
  }

  async function handleDelete(id: unknown) {
    await remove(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 flex-1 sm:max-w-md rounded-xl border border-border bg-muted/20 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-colors min-h-[44px]">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
          <input
            type="text"
            placeholder={`Search ${config.displayName.toLowerCase()}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="bg-transparent text-body text-foreground placeholder:text-muted-foreground outline-none flex-1 min-w-0 focus-ring"
            aria-label={`Search ${config.displayName}`}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/50 transition-colors focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center -my-1 -mr-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center transition-colors focus-ring"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canWrite && (
            <button
              type="button"
              onClick={openAddForm}
              className="min-h-[44px] px-4 sm:px-6 rounded-xl bg-primary hover:bg-[hsl(var(--primary-hover))] text-primary-foreground font-semibold text-body flex items-center gap-2 transition-colors focus-ring"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Table card with title bar */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden min-w-0 max-w-full">
        {!isLoading && !error && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="font-display font-semibold text-section-title text-foreground">{config.displayName}</h2>
            <span className="text-caption font-medium text-muted-foreground px-2.5 py-1 rounded-md bg-background/80">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </span>
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-7 h-7" />
            </motion.div>
            <span className="text-sm">Loading {config.displayName.toLowerCase()}…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-destructive gap-2">
            <AlertCircle className="w-8 h-8" />
            <span className="text-sm font-medium">Something went wrong</span>
            <span className="text-xs text-muted-foreground max-w-sm text-center">{(error as Error).message}</span>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto scrollbar-glass">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {canWrite && (
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-foreground w-[100px]">
                        Actions
                      </th>
                    )}
                    {tableCols.map((col) => (
                      <th key={col.key} className="text-left py-3.5 px-4 text-xs font-semibold text-foreground">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={tableCols.length + 1} className="py-20 text-center" style={{ width: "100%" }}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-3 text-muted-foreground"
                        >
                          <img src="/favicon.ico" alt="" className="w-12 h-12 opacity-30" />
                          <p className="text-sm">{search ? "No results found for your search" : "No entries yet"}</p>
                          {!search && canWrite && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={openAddForm}
                              className="text-xs text-primary font-medium hover:underline"
                            >
                              Add the first entry
                            </motion.button>
                          )}
                        </motion.div>
                      </td>
                    </tr>
                  ) : (
                    paged.map((row, i) => (
                      <motion.tr
                        key={String(row[config.primaryKey]) || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                        className={`border-b border-border/20 transition-colors group even:bg-muted/30 hover:bg-primary/[0.06]`}
                      >
                        {canWrite && (
                          <td className="py-3.5 px-4 w-[100px] shrink-0">
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => openEditForm(row)}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </motion.button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setDeleteConfirm(row[config.primaryKey])}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </motion.button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        )}
                        {tableCols.map((col) => (
                          <td key={col.key} className="py-3.5 px-4 max-w-[250px] truncate">
                            {isStatusCol(col) ? (
                              <StatusBadge value={String(row[col.key] ?? "")} />
                            ) : (
                              <span className="text-foreground/90 group-hover:text-foreground transition-colors">
                                {formatCellValue(row[col.key], col)}
                              </span>
                            )}
                          </td>
                        ))}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card view — visible only on small screens */}
            <div className="sm:hidden">
              {paged.length === 0 ? (
                <div className="py-16 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 text-muted-foreground"
                  >
                    <img src="/favicon.ico" alt="NavMe Demo" className="w-12 h-12 opacity-30" />
                    <p className="text-sm">{search ? "No results found" : "Nothing here yet"}</p>
                    {!search && canWrite && (
                      <button onClick={openAddForm} className="text-xs text-primary hover:underline">
                        Tap here to add the first entry
                      </button>
                    )}
                  </motion.div>
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {paged.map((row, i) => (
                    <motion.div
                      key={String(row[config.primaryKey]) || i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="p-4 active:bg-primary/[0.04] transition-colors"
                    >
                      <div className="space-y-2">
                        {tableCols.slice(0, 4).map((col) => (
                          <div key={col.key} className="flex items-start justify-between gap-3">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                              {col.label}
                            </span>
                            <span className="text-sm text-foreground text-right truncate max-w-[60%]">
                              {isStatusCol(col) ? (
                                <StatusBadge value={String(row[col.key] ?? "")} />
                              ) : (
                                formatCellValue(row[col.key], col)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                      {canWrite && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/10">
                          <button
                            onClick={() => openEditForm(row)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-primary bg-primary/10 active:bg-primary/20 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(row[config.primaryKey])}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-destructive bg-destructive/10 active:bg-destructive/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 border-t border-border/20">
              <span className="text-xs text-muted-foreground">
                {filtered.length === 0 ? "No entries" : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} entries`}
              </span>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <span className="text-xs text-muted-foreground px-3 py-1 rounded-lg bg-secondary/30">
                  {page + 1} / {totalPages}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && closeForm()}
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
                  <h2 className="text-lg font-bold text-foreground">
                    {editingRow ? "Edit Entry" : "Add New Entry"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {editingRow ? "Update the details below and save your changes" : `Fill in the details below to add to ${config.displayName}`}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeForm}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                {formCols.map((col, i) => {
                  if (!col.editable && editingRow) return null;
                  return (
                    <motion.div
                      key={col.key}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        {col.label} {col.required && <span className="text-destructive">*</span>}
                      </label>
                      {col.type === "textarea" ? (
                        <textarea
                          value={String(formData[col.key] ?? "")}
                          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                          placeholder={col.placeholder}
                          required={col.required}
                          rows={3}
                          className="glass-input w-full resize-none focus:shadow-[0_0_25px_hsla(221,83%,53%,0.1)]"
                        />
                      ) : col.type === "select" && col.options ? (
                        <select
                          value={String(formData[col.key] ?? "")}
                          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                          className="glass-input w-full"
                        >
                          <option value="">Select...</option>
                          {col.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col.type === "date" ? "date" : col.type === "number" ? "number" : "text"}
                          value={String(formData[col.key] ?? "")}
                          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                          placeholder={col.placeholder}
                          required={col.required}
                          className="glass-input w-full focus:shadow-[0_0_25px_hsla(221,83%,53%,0.1)]"
                        />
                      )}
                    </motion.div>
                  );
                })}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-end gap-3 pt-3 border-t border-border/10"
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={closeForm}
                    className="h-10 px-5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03, boxShadow: "0 0 30px hsla(221, 83%, 53%, 0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isInserting || isUpdating}
                    className="h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {(isInserting || isUpdating) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingRow ? "Save Changes" : "Add Entry"}
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
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
              <h3 className="text-lg font-bold text-foreground mb-1">Remove this entry?</h3>
              <p className="text-sm text-muted-foreground mb-7">This will permanently remove this entry. This action cannot be undone.</p>
              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDeleteConfirm(null)}
                  className="h-10 px-5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={isDeleting}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-destructive/20"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
