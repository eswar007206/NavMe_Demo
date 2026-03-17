import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuCamera as Camera, LuLoaderCircle as Loader2, LuX as X } from "react-icons/lu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AvatarUploadProps {
  currentUrl: string | null;
  displayName: string;
  adminId: string;
  size?: string;
  disabled?: boolean;
  onUploaded?: (url: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AvatarUpload({
  currentUrl,
  displayName,
  adminId,
  size = "w-10 h-10",
  disabled = false,
  onUploaded,
}: AvatarUploadProps) {
  const { refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2 MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    setSelectedFile(file);
    setShowDialog(true);
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  }

  function closeDialog() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setShowDialog(false);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const ext = selectedFile.name.split(".").pop() || "png";
      const filePath = `${adminId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-avatars")
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("admin-avatars")
        .getPublicUrl(filePath);

      // Update profile in DB
      await supabase.rpc("update_admin_profile", {
        p_admin_id: adminId,
        p_avatar_url: publicUrl,
      });

      await refreshUser();
      onUploaded?.(publicUrl);
      closeDialog();
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={(e) => { if (disabled) return; e.stopPropagation(); e.preventDefault(); fileRef.current?.click(); }}
        className={`relative group ${disabled ? "cursor-default" : "cursor-pointer"}`}
      >
        <Avatar className={`${size} rounded-xl ring-2 ring-white/10`}>
          <AvatarImage src={currentUrl || undefined} alt={displayName} />
          <AvatarFallback className="rounded-xl bg-primary/20 text-primary text-xs font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {!disabled && (
          <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
        )}
      </button>

      {/* Upload preview dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && !uploading && closeDialog()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl bg-background/80"
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={closeDialog}
                  disabled={uploading}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-4">Update Profile Photo</h3>

              {/* Preview */}
              <div className="flex justify-center mb-6">
                <Avatar className="w-28 h-28 rounded-2xl ring-4 ring-primary/20">
                  <AvatarImage src={preview || undefined} alt="Preview" />
                  <AvatarFallback className="rounded-2xl bg-primary/20 text-primary text-xl font-bold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex items-center justify-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={closeDialog}
                  disabled={uploading}
                  className="h-10 px-5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 0 30px hsla(221, 83%, 53%, 0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUpload}
                  disabled={uploading}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? "Uploading..." : "Upload"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
