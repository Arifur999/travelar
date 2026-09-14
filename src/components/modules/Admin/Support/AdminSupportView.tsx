"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  replyToTicketAction,
  updateTicketStatusAction,
} from "@/app/(dashboardLayout)/admin/dashboard/_action";
import Loader from "@/components/shared/Loader";
import DateCell from "@/components/shared/cell/DateCell";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import DataTable from "@/components/shared/table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useRowActionModalState } from "@/hooks/useRowActionModalState";
import { useServerManagedDataTable } from "@/hooks/useServerManagedDataTable";
import {
  serverManagedFilter,
  useServerManagedDataTableFilters,
} from "@/hooks/useServerManagedDataTableFilters";
import { useServerManagedDataTableSearch } from "@/hooks/useServerManagedDataTableSearch";
import { formatDateTime } from "@/lib/format";
import { type AppColumnDef } from "@/lib/table/features";
import { cn } from "@/lib/utils";
import { getAdminTicketById, getAllTickets } from "@/services/support.services";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_PRIORITY_OPTIONS,
  SUPPORT_PRIORITY_TONES,
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_OPTIONS,
  SUPPORT_STATUS_TONES,
} from "@/types/enums.types";
import { type ISupportTicket } from "@/types/support.types";
import { type DataTableFilterConfig } from "@/types/table.types";

const FILTER_DEFINITIONS = [
  serverManagedFilter.multi("status"),
  serverManagedFilter.single("priority"),
  serverManagedFilter.single("category"),
];

const FILTER_CONFIGS: DataTableFilterConfig[] = [
  { filterId: "status", label: "Status", type: "multi-select", options: SUPPORT_STATUS_OPTIONS },
  { filterId: "priority", label: "Priority", type: "single-select", options: SUPPORT_PRIORITY_OPTIONS },
  { filterId: "category", label: "Category", type: "single-select", options: SUPPORT_CATEGORY_OPTIONS },
];

const columns: AppColumnDef<ISupportTicket>[] = [
  {
    id: "subject",
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{row.original.subject}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.agency?.name ?? "—"}
        </p>
      </div>
    ),
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <StatusBadge
        label={SUPPORT_PRIORITY_LABELS[row.original.priority]}
        tone={SUPPORT_PRIORITY_TONES[row.original.priority]}
      />
    ),
  },
  {
    id: "category",
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline">{SUPPORT_CATEGORY_LABELS[row.original.category]}</Badge>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        label={SUPPORT_STATUS_LABELS[row.original.status]}
        tone={SUPPORT_STATUS_TONES[row.original.status]}
      />
    ),
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Last activity",
    cell: ({ row }) => <DateCell date={row.original.updatedAt} withTime />,
  },
];

/**
 * Every agency's tickets, unscoped. The tenant side lists only its own; this
 * one is reached through /admin, which is SUPER_ADMIN only.
 */
const AdminSupportView = ({ initialQueryString }: { initialQueryString: string }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const {
    searchParams,
    queryStringFromUrl,
    optimisticSortingState,
    optimisticPaginationState,
    isRouteRefreshPending,
    updateParams,
    handleSortingChange,
    handlePaginationChange,
  } = useServerManagedDataTable();

  const { searchTermFromUrl, handleDebouncedSearchChange } = useServerManagedDataTableSearch({
    searchParams,
    updateParams,
  });

  const { filterValues, handleFilterChange, clearAllFilters } = useServerManagedDataTableFilters({
    searchParams,
    definitions: FILTER_DEFINITIONS,
    updateParams,
  });

  const { viewingItem, isViewDialogOpen, onViewOpenChange, tableActions } =
    useRowActionModalState<ISupportTicket>({ enableEdit: false, enableDelete: false });

  const effectiveQueryString = queryStringFromUrl || initialQueryString;

  const { data, isFetching } = useQuery({
    queryKey: ["admin-tickets", effectiveQueryString],
    queryFn: () => getAllTickets(effectiveQueryString),
  });

  const { data: detailData, isFetching: isLoadingDetail } = useQuery({
    queryKey: ["admin-ticket", viewingItem?.id],
    queryFn: () => getAdminTicketById(viewingItem!.id),
    enabled: viewingItem !== null,
  });

  const detail = detailData?.data;

  const { mutateAsync: sendReply, isPending: isSending } = useMutation({
    mutationFn: (message: string) => replyToTicketAction(viewingItem!.id, { message }),
  });

  const { mutateAsync: setStatus, isPending: isSettingStatus } = useMutation({
    mutationFn: (status: string) => updateTicketStatusAction(viewingItem!.id, { status }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-ticket", viewingItem?.id] });
    void queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    void queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    void queryClient.refetchQueries({ queryKey: ["admin-tickets"], type: "active" });
    router.refresh();
  };

  const handleReply = async () => {
    const message = reply.trim();
    if (!message) return;

    const result = await sendReply(message);
    if (!result.success) {
      toast.error(result.message || "Failed to send the reply");
      return;
    }
    setReply("");
    invalidate();
  };

  const handleStatus = async (status: string) => {
    const result = await setStatus(status);
    if (!result.success) {
      toast.error(result.message || "Failed to update the status");
      return;
    }
    toast.success("Status updated");
    invalidate();
  };

  return (
    <>
      <DataTable<ISupportTicket>
        data={data?.data ?? []}
        columns={columns}
        actions={tableActions}
        meta={data?.meta}
        isLoading={isFetching || isRouteRefreshPending}
        emptyMessage="No tickets match."
        search={{
          initialValue: searchTermFromUrl,
          placeholder: "Search subject or agency",
          onDebouncedChange: handleDebouncedSearchChange,
        }}
        sorting={{ state: optimisticSortingState, onSortingChange: handleSortingChange }}
        pagination={{ state: optimisticPaginationState, onPaginationChange: handlePaginationChange }}
        filters={{
          configs: FILTER_CONFIGS,
          values: filterValues,
          onFilterChange: handleFilterChange,
          onClearAll: clearAllFilters,
        }}
      />

      <Sheet
        open={isViewDialogOpen}
        onOpenChange={(nextOpen) => {
          onViewOpenChange(nextOpen);
          if (!nextOpen) setReply("");
        }}
      >
        <SheetContent className="w-full gap-0 sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-base">{viewingItem?.subject}</SheetTitle>
            <SheetDescription>
              {viewingItem?.agency?.name} · {viewingItem?.createdBy?.name ?? "Unknown"} (
              {viewingItem?.createdBy?.email ?? "—"})
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-end gap-2 border-b px-4 pb-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="ticket-status" className="text-xs">
                Status
              </Label>
              <Select
                value={detail?.status ?? viewingItem?.status}
                onValueChange={handleStatus}
                disabled={isSettingStatus}
              >
                <SelectTrigger id="ticket-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {isLoadingDetail && !detail ? (
              <div className="flex h-32 items-center justify-center">
                <Loader size={28} label="Loading thread" />
              </div>
            ) : (
              (detail?.messages ?? []).map((message) => {
                const fromOperator = message.senderRole === "SUPER_ADMIN";
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-lg border p-3 text-sm",
                      fromOperator ? "ml-auto bg-primary/5" : "bg-muted/50",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {fromOperator ? "You" : (message.sender?.name ?? "Agency")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.message}</p>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t p-4">
            {detail?.status === "CLOSED" && (
              <p className="mb-2 text-xs text-muted-foreground">
                Closed — the agency can no longer reply, but you can still add a closing note.
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Write a reply..."
                aria-label="Reply"
                rows={2}
                disabled={isSending}
              />
              <Button
                type="button"
                onClick={handleReply}
                disabled={isSending || reply.trim().length === 0}
                aria-label="Send reply"
              >
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AdminSupportView;
