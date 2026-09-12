"use client";

import { useCallback, useMemo, useState } from "react";

interface UseRowActionModalStateOptions {
  enableView?: boolean;
  enableEdit?: boolean;
  enableDelete?: boolean;
}

/**
 * Owns the "which row is being viewed / edited / deleted" state for every
 * management table, so a table does not hand-roll three useStates and three
 * open-change handlers.
 *
 * A disabled action returns `undefined` rather than a no-op function — that is
 * what lets DataTable omit the menu item entirely instead of rendering one that
 * does nothing.
 */
export const useRowActionModalState = <TData,>({
  enableView = true,
  enableEdit = true,
  enableDelete = true,
}: UseRowActionModalStateOptions = {}) => {
  const [viewingItem, setViewingItem] = useState<TData | null>(null);
  const [editingItem, setEditingItem] = useState<TData | null>(null);
  const [deletingItem, setDeletingItem] = useState<TData | null>(null);

  // Clearing the item on close is what makes the dialog unmount its form, so
  // reopening on a different row does not show the previous row's values.
  const onViewOpenChange = useCallback((open: boolean) => {
    if (!open) setViewingItem(null);
  }, []);
  const onEditOpenChange = useCallback((open: boolean) => {
    if (!open) setEditingItem(null);
  }, []);
  const onDeleteOpenChange = useCallback((open: boolean) => {
    if (!open) setDeletingItem(null);
  }, []);

  const tableActions = useMemo(
    () => ({
      onView: enableView ? (data: TData) => setViewingItem(data) : undefined,
      onEdit: enableEdit ? (data: TData) => setEditingItem(data) : undefined,
      onDelete: enableDelete ? (data: TData) => setDeletingItem(data) : undefined,
    }),
    [enableView, enableEdit, enableDelete],
  );

  return {
    viewingItem,
    editingItem,
    deletingItem,
    isViewDialogOpen: viewingItem !== null,
    isEditModalOpen: editingItem !== null,
    isDeleteDialogOpen: deletingItem !== null,
    onViewOpenChange,
    onEditOpenChange,
    onDeleteOpenChange,
    tableActions,
  };
};
