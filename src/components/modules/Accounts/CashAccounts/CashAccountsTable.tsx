"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  RiAddLine,
  RiArrowDownCircleLine,
  RiArrowUpCircleLine,
  RiBankLine,
  RiWallet3Line,
} from "@remixicon/react";
import { toast } from "sonner";
import { deleteCashAccountAction } from "@/app/(dashboardLayout)/dashboard/accounts/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StatsCard from "@/components/shared/StatsCard";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getCashAccounts } from "@/services/account.services";
import { type IAccountBalance } from "@/types/account.types";
import CashAccountFormModal from "./CashAccountFormModal";
import { cashAccountsColumns } from "./cashAccountsColumns";

const CashAccountsTable = () => {
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
  } = useRowActionModalState<IAccountBalance>({ enableView: false });

  /**
   * No query string and no `sorting`/`pagination` props — `GET /accounts` is
   * deliberately unpaginated because an agency has a handful of accounts, so
   * DataTable sorts in memory here. This is the one table in the product that
   * is not server-managed.
   */
  const { data, isFetching } = useQuery({
    queryKey: ["cash-accounts"],
    queryFn: () => getCashAccounts(),
  });

  const accounts = data?.data.data ?? [];
  const summary = data?.data.summary;

  const { mutateAsync: runDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteCashAccountAction(id),
  });

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    const result = await runDelete(deletingItem.id);

    if (!result.success) {
      toast.error(result.message || "Failed to delete account");
      return;
    }

    toast.success(result.message || "Account deleted");
    onDeleteOpenChange(false);
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    void queryClient.refetchQueries({ queryKey: ["cash-accounts"], type: "active" });
    router.refresh();
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total balance"
          value={formatCurrency(summary?.totalBalance ?? 0)}
          icon={RiWallet3Line}
          accent="primary"
          hint="Active accounts only"
        />
        <StatsCard
          title="Money in"
          value={formatCurrency(accounts.reduce((sum, a) => sum + a.totalIn, 0))}
          icon={RiArrowUpCircleLine}
          accent="success"
          hint="All postings, all time"
        />
        <StatsCard
          title="Money out"
          value={formatCurrency(accounts.reduce((sum, a) => sum + a.totalOut, 0))}
          icon={RiArrowDownCircleLine}
          accent="destructive"
          hint="All postings, all time"
        />
        <StatsCard
          title="Accounts"
          value={formatNumber(summary?.activeAccounts ?? 0)}
          icon={RiBankLine}
          accent="ledger"
          hint={
            summary && summary.totalAccounts !== summary.activeAccounts
              ? `${summary.totalAccounts - summary.activeAccounts} archived, holding ${formatCurrency(summary.inactiveBalance)}`
              : "All active"
          }
        />
      </div>

      <DataTable<IAccountBalance>
        data={accounts}
        columns={cashAccountsColumns}
        actions={tableActions}
        isLoading={isFetching}
        emptyMessage="No accounts yet. Add cash in hand and each bank account you use."
        toolbarAction={
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <RiAddLine className="size-4" aria-hidden="true" />
            Add account
          </Button>
        }
      />

      <CashAccountFormModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      {editingItem && (
        <CashAccountFormModal
          key={editingItem.id}
          open={isEditModalOpen}
          onOpenChange={onEditOpenChange}
          account={editingItem}
        />
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={onDeleteOpenChange}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
        title="Delete this account?"
        description={
          <>
            <span className="font-medium text-foreground">{deletingItem?.name}</span> will be
            removed. The API refuses this while the account still carries postings or a non-zero
            balance — archive it instead to keep the history and take it out of the headline
            figure.
          </>
        }
      />
    </>
  );
};

export default CashAccountsTable;
