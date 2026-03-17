import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TableConfig } from "@/lib/tableConfig";
import { toast } from "sonner";

export function useTableData(config: TableConfig) {
  const queryClient = useQueryClient();
  const queryKey = ["table", config.tableName];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase.from(config.tableName).select("*");
      if (config.defaultSort) {
        q = q.order(config.defaultSort.key, {
          ascending: config.defaultSort.direction === "asc",
        });
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Record<string, unknown>[];
    },
  });

  const insertMutation = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from(config.tableName)
        .insert(row)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Row added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: unknown;
      updates: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from(config.tableName)
        .update(updates)
        .eq(config.primaryKey, id as string)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Row updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: unknown) => {
      const { error } = await supabase
        .from(config.tableName)
        .delete()
        .eq(config.primaryKey, id as string);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Row deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    insert: insertMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isInserting: insertMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
