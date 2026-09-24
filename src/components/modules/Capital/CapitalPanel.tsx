"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine, RiArrowDownCircleLine, RiCashLine, RiFundsBoxLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  deleteCapitalFlowAction,
  deleteProfitWithdrawalAction,
} from "@/app/(dashboardLayout)/dashboard/capital/_action";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import BreakdownDonut from "@/components/shared/chart/BreakdownDonut";
import StatsCard from "@/components/shared/StatsCard";
import DataTable from "@/components/shared/table/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import { safeKey, seriesColor } from "@/lib/chartSlices";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import {
  getCapitalFlows,
  getCapitalSummary,
  getProfitWithdrawals,
} from "@/services/capital.services";
import { type ICapitalFlow, type IProfitWithdrawal } from "@/types/capital.types";
import CapitalFlowFormModal from "./CapitalFlowFormModal";
import ProfitWithdrawalFormModal from "./ProfitWithdrawalFormModal";
import { capitalFlowColumns, profitWithdrawalColumns } from "./capitalColumns";

/**
 * Two independent lists on one page.
 *
 * Both use the same URL params for page and sort, so paging one would page the
 * other. The capital list is the one wired to the URL; the withdrawals list is
 * given its own local page state, which is the honest trade-off for keeping
 * them on a single screen where they belong conceptually.
 */
const CapitalPanel = ({ initialQueryString }: { initialQueryString: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const [withdrawalPage, setWithdrawalPage] = useState(0);

  const {
    queryStringFromUrl,
    optimisticSortingState,
    optimisticPaginationState,
    isRouteRefreshPending,
    handleSortingChange,
    handlePaginationChange,
  } = useServerManagedDataTable();

  const flowActions = useRowActionModalState<ICapitalFlow>({
    enableView: false,
    enableEdit: false,
  });
  const withdrawalActions = useRowActionModalState<IProfitWithdrawal>({
    enableView: false,
    enableEdit: false,
  });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data: flowsData, isFetching: isFetchingFlows } = useQuery({
    queryKey: ["capital-flows", effectiveQueryString],
    queryFn: () => getCapitalFlows(effectiveQueryString),
  });

  const withdrawalQuery = `page=${withdrawalPage + 1}&limit=10`;
  const { data: withdrawalsData, isFetching: isFetchingWithdrawals } = useQuery({
    queryKey: ["profit-withdrawals", withdrawalQuery],
    queryFn: () => getProfitWithdrawals(withdrawalQuery),
  });

  const { data: summaryData } = useQuery({
    queryKey: ["capital-summary"],
    queryFn: () => getCapitalSummary(),
  });

  const { mutateAsync: runDeleteFlow, isPending: isDeletingFlow } = useMutation({
    mutationFn: (id: string) => deleteCapitalFlowAction(id),
  });

  const { mutateAsync: runDeleteWithdrawal, isPending: isDeletingWithdrawal } = useMutation({
    mutationFn: (id: string) => deleteProfitWithdrawalAction(id),
  });

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["capital-flows"] });
    void queryClient.invalidateQueries({ queryKey: ["capital-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["profit-withdrawals"] });
    void queryClient.invalidateQueries({ queryKey: ["cash-accounts"] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-overview"] });
    router.refresh();
  };

  const handleDeleteFlow = async () => {
    const item = flowActions.deletingItem;
    if (!item) return;

    const result = await runDeleteFlow(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete entry");
      return;
    }

    toast.success(result.message || "Entry reversed");
    flowActions.onDeleteOpenChange(false);
    invalidateAll();
  };

  const handleDeleteWithdrawal = async () => {
    const item = withdrawalActions.deletingItem;
    if (!item) return;

    const result = await runDeleteWithdrawal(item.id);
    if (!result.success) {
      toast.error(result.message || "Failed to delete withdrawal");
      return;
    }

    toast.success(result.message || "Withdrawal reversed");
    withdrawalActions.onDeleteOpenChange(false);
    invalidateAll();
  };

  const summary = summaryData?.data.summary;
  const owners = summaryData?.data.owners ?? [];
  const withdrawalSummary = withdrawalsData?.data.summary;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Net investment"
          value={formatCurrency(summary?.netInvestment ?? 0)}
          icon={RiFundsBoxLine}
          accent="ledger"
          hint="Invested − withdrawn"
        />
        <StatsCard
          title="Invested"
          value={formatCurrency(summary?.totalInvest ?? 0)}
          icon={RiCashLine}
          accent="success"
        />
        <StatsCard
          title="Capital withdrawn"
          value={formatCurrency(summary?.totalWithdraw ?? 0)}
          icon={RiArrowDownCircleLine}
          accent="expense"
          hint="Reduces the stake"
        />
        <StatsCard
          title="Profit withdrawn"
          value={formatCurrency(withdrawalSummary?.totalWithdrawn ?? 0)}
          icon={RiArrowDownCircleLine}
          accent="destructive"
          hint="Does not reduce the stake"
        />
      </div>

      <BreakdownDonut
        title="Who owns the business"
        description="Net capital per owner — what each has put in, less what they have taken back."
        slices={owners.map((owner, index) => ({
          key: safeKey(owner.ownerName, index),
          label: owner.ownerName,
          value: owner.netInvestment,
          color: seriesColor(index),
        }))}
        centreCaption="net capital"
        emptyText="No capital in the business yet. Record an investment and this fills in."
      />

      {owners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Owners</CardTitle>
            <CardDescription>
              Net capital per owner, and the share of the business it represents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">Owner</th>
                    <th className="px-3 py-2 text-right font-medium">Invested</th>
                    <th className="px-3 py-2 text-right font-medium">Withdrawn</th>
                    <th className="px-3 py-2 text-right font-medium">Net</th>
                    <th className="px-3 py-2 text-right font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((owner) => (
                    <tr key={owner.ownerName} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{owner.ownerName}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-success">
                        {formatCurrency(owner.invested)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(owner.withdrawn)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {formatCurrency(owner.netInvestment)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {/* 0% when net capital is zero, which the API returns
                            rather than dividing by zero. */}
                        {formatPercent(owner.sharePercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatNumber(summary?.totalOwners ?? 0)}{" "}
              {summary?.totalOwners === 1 ? "owner" : "owners"}. Shares are by capital
              contributed, not by any agreed split.
            </p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Capital in and out</h3>
        <DataTable<ICapitalFlow>
          data={flowsData?.data.entries ?? []}
          columns={capitalFlowColumns}
          actions={flowActions.tableActions}
          meta={flowsData?.meta}
          isLoading={isFetchingFlows || isRouteRefreshPending}
          emptyMessage="No capital entries yet."
          sorting={{
            state: optimisticSortingState,
            onSortingChange: handleSortingChange,
          }}
          pagination={{
            state: optimisticPaginationState,
            onPaginationChange: handlePaginationChange,
          }}
          toolbarAction={
            <Button type="button" onClick={() => setIsFlowOpen(true)}>
              <RiAddLine className="size-4" aria-hidden="true" />
              Record capital
            </Button>
          }
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Profit withdrawals</h3>
        <DataTable<IProfitWithdrawal>
          data={withdrawalsData?.data.withdrawals ?? []}
          columns={profitWithdrawalColumns}
          actions={withdrawalActions.tableActions}
          meta={withdrawalsData?.meta}
          isLoading={isFetchingWithdrawals}
          emptyMessage="No profit withdrawals yet."
          pagination={{
            // Local, not URL-driven — the capital list above owns the URL params.
            state: { pageIndex: withdrawalPage, pageSize: 10 },
            onPaginationChange: (next) => setWithdrawalPage(next.pageIndex),
          }}
          toolbarAction={
            <Button type="button" variant="outline" onClick={() => setIsWithdrawalOpen(true)}>
              <RiAddLine className="size-4" aria-hidden="true" />
              Withdraw profit
            </Button>
          }
        />
      </section>

      <CapitalFlowFormModal open={isFlowOpen} onOpenChange={setIsFlowOpen} />
      <ProfitWithdrawalFormModal open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen} />

      <ConfirmDialog
        open={flowActions.isDeleteDialogOpen}
        onOpenChange={flowActions.onDeleteOpenChange}
        onConfirm={handleDeleteFlow}
        isPending={isDeletingFlow}
        title="Reverse this capital entry?"
        confirmLabel="Reverse"
        pendingLabel="Reversing..."
        description={
          <>
            {flowActions.deletingItem && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(flowActions.deletingItem.amount)}
                </span>{" "}
                for {flowActions.deletingItem.ownerName}.{" "}
              </>
            )}
            The posting is deleted, so the account balance and the owner&apos;s stake both go
            back to what they were.
          </>
        }
      />

      <ConfirmDialog
        open={withdrawalActions.isDeleteDialogOpen}
        onOpenChange={withdrawalActions.onDeleteOpenChange}
        onConfirm={handleDeleteWithdrawal}
        isPending={isDeletingWithdrawal}
        title="Reverse this withdrawal?"
        confirmLabel="Reverse"
        pendingLabel="Reversing..."
        description={
          <>
            {withdrawalActions.deletingItem && (
              <>
                <span className="font-medium text-foreground">
                  {formatCurrency(withdrawalActions.deletingItem.amount)}
                </span>{" "}
                to {withdrawalActions.deletingItem.receivedBy}.{" "}
              </>
            )}
            The posting is deleted, so the account goes back up.
          </>
        }
      />
    </>
  );
};

export default CapitalPanel;
