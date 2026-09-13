"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteVisaAgentAction } from "@/app/(dashboardLayout)/dashboard/visa/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { getVisaAgents } from "@/services/visa.services";
import { type IVisaAgent } from "@/types/visa.types";
import VisaAgentFormModal from "./VisaAgentFormModal";
import { visaAgentsColumns } from "./visaColumns";

/**
 * Agents sit below the cases on the same page, sorted client-side — an agency
 * has a handful of them, and giving them their own URL params would fight with
 * the cases table above.
 */
const VisaAgentsPanel = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    editingItem,
    deletingItem,
    isEditModalOpen,
    isDeleteDialogOpen,
    onEditOpenChange,
    onDeleteOpenChange,
    tableActions,
  } = useRowActionModalState<IVisaAgent>({ enableView: false });

  const { data, isFetching } = useQuery({
    queryKey: ["visa-agents"],
    queryFn: () => getVisaAgents("limit=200"),
  });

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteVisaAgentAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete agent");
      return;
    }

    toast.success(result.message || "Agent deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["visa-agents"] });
    void queryClient.refetchQueries({ queryKey: ["visa-agents"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Agents</CardTitle>
            <CardDescription>
              Embassies, consultancies and agents a case can be routed through.
            </CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add agent
          </Button>
        </CardHeader>

        <CardContent>
          <DataTable<IVisaAgent>
            data={data?.data ?? []}
            columns={visaAgentsColumns}
            actions={tableActions}
            isLoading={isFetching}
            emptyMessage="No agents yet. Cases can still be handled in-house."
          />
        </CardContent>
      </Card>

      <VisaAgentFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <VisaAgentFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          agent={editingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this agent?"
        description={
          <>
            <span className="font-medium text-foreground">{deletingItem?.name}</span> will be
            removed. The delete is refused while any case still routes through them.
          </>
        }
      />
    </>
  );
};

export default VisaAgentsPanel;
