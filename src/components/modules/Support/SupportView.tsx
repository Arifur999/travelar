"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiChatNewLine, RiSendPlaneLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  addTicketMessageAction,
  createSupportTicketAction,
} from "@/app/(dashboardLayout)/dashboard/support/_action";
import Loader from "@/components/shared/Loader";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getMyTickets, getTicketById } from "@/services/support.services";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_PRIORITY_OPTIONS,
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_TONES,
  type SupportCategory,
  type SupportPriority,
} from "@/types/enums.types";
import { type ISupportTicket } from "@/types/support.types";
import {
  supportTicketFieldsZodSchema,
  type ISupportTicketFormValues,
} from "@/zod/support.validation";

const SupportView = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openTicket, setOpenTicket] = useState<ISupportTicket | null>(null);
  const [reply, setReply] = useState("");

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => getMyTickets("limit=50&sortBy=updatedAt&sortOrder=desc"),
  });

  const { data: detailData, isFetching: isLoadingDetail } = useQuery({
    queryKey: ["support-ticket", openTicket?.id],
    queryFn: () => getTicketById(openTicket!.id),
    enabled: openTicket !== null,
  });

  const tickets = ticketsData?.data ?? [];
  const detail = detailData?.data;

  const { mutateAsync: createTicket, isPending: isCreating } = useMutation({
    mutationFn: (values: ISupportTicketFormValues) => createSupportTicketAction(values),
  });

  const { mutateAsync: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (message: string) => addTicketMessageAction(openTicket!.id, { message }),
  });

  const defaultValues: ISupportTicketFormValues = {
    subject: "",
    message: "",
    category: "TECHNICAL",
    priority: "MEDIUM",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await createTicket(value);

      if (!result.success) {
        toast.error(result.message || "Failed to open the ticket");
        return;
      }

      toast.success(result.message || "Ticket opened");
      setIsCreateOpen(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      router.refresh();
    },
  });

  const handleReply = async () => {
    const message = reply.trim();
    if (!message) return;

    const result = await sendMessage(message);

    if (!result.success) {
      toast.error(result.message || "Failed to send the message");
      return;
    }

    setReply("");
    void queryClient.invalidateQueries({ queryKey: ["support-ticket", openTicket?.id] });
    void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    router.refresh();
  };

  // A closed thread stops accepting replies from the agency — the API refuses
  // them, so the box is disabled rather than failing on submit.
  const isClosed = detail?.status === "CLOSED";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Your tickets</CardTitle>
            <CardDescription>
              Reachable whatever your subscription is doing — a lapsed agency is exactly the one
              that needs support.
            </CardDescription>
          </div>
          <Button type="button" size="sm" onClick={() => setIsCreateOpen(true)}>
            <RiChatNewLine className="size-4" aria-hidden="true" />
            New ticket
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader size={28} label="Loading tickets" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No tickets yet.
            </p>
          ) : (
            <ul className="divide-y">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setOpenTicket(ticket)}
                    className="flex w-full flex-wrap items-center gap-2 py-3 text-left hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {SUPPORT_CATEGORY_LABELS[ticket.category]} ·{" "}
                        {SUPPORT_PRIORITY_LABELS[ticket.priority]} ·{" "}
                        {formatDateTime(ticket.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge
                      label={SUPPORT_STATUS_LABELS[ticket.status]}
                      tone={SUPPORT_STATUS_TONES[ticket.status]}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* New ticket */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(nextOpen) => {
          setIsCreateOpen(nextOpen);
          if (!nextOpen) form.reset();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Open a ticket</DialogTitle>
            <DialogDescription>
              Describe what happened. The thread stays here and the operator replies in it.
            </DialogDescription>
          </DialogHeader>

          <form
            method="POST"
            action="#"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-5"
          >
            <form.Field
              name="subject"
              validators={{ onChange: supportTicketFieldsZodSchema.shape.subject }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Subject"
                  placeholder="A short summary"
                  disabled={isCreating}
                />
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="category">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Category</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(next) => field.handleChange(next as SupportCategory)}
                      disabled={isCreating}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORT_CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="priority">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Priority</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(next) => field.handleChange(next as SupportPriority)}
                      disabled={isCreating}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORT_PRIORITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field
              name="message"
              validators={{ onChange: supportTicketFieldsZodSchema.shape.message }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Message</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={5}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="What went wrong, and what you expected..."
                    disabled={isCreating}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p role="alert" className="text-sm text-destructive">
                      Message is too short
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isCreating}>
                  Cancel
                </Button>
              </DialogClose>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting] as const}
              >
                {([canSubmit, isSubmitting]) => (
                  <AppSubmitButton
                    isPending={isSubmitting || isCreating}
                    pendingLabel="Opening..."
                    disabled={!canSubmit}
                    className="w-auto"
                  >
                    Open ticket
                  </AppSubmitButton>
                )}
              </form.Subscribe>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Thread */}
      <Sheet
        open={openTicket !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setOpenTicket(null);
            setReply("");
          }
        }}
      >
        <SheetContent className="w-full gap-0 sm:max-w-xl">
          <SheetHeader>
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle className="text-base">{openTicket?.subject}</SheetTitle>
              {detail && (
                <StatusBadge
                  label={SUPPORT_STATUS_LABELS[detail.status]}
                  tone={SUPPORT_STATUS_TONES[detail.status]}
                />
              )}
            </div>
            <SheetDescription>
              {openTicket && (
                <>
                  {SUPPORT_CATEGORY_LABELS[openTicket.category]} ·{" "}
                  {SUPPORT_PRIORITY_LABELS[openTicket.priority]}
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
            {isLoadingDetail && !detail ? (
              <div className="flex h-32 items-center justify-center">
                <Loader size={28} label="Loading thread" />
              </div>
            ) : (
              (detail?.messages ?? []).map((message) => {
                // senderRole is what tells the two sides apart without needing
                // to know any user ids.
                const fromOperator = message.senderRole === "SUPER_ADMIN";

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-lg border p-3 text-sm",
                      fromOperator ? "bg-muted/50" : "ml-auto bg-primary/5",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {fromOperator ? "Support" : (message.sender?.name ?? "You")}
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
            {isClosed ? (
              <p className="text-sm text-muted-foreground">
                This ticket is closed and no longer accepts replies. Open a new one if you still
                need help.
              </p>
            ) : (
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
                  <RiSendPlaneLine className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SupportView;
