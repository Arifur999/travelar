"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import Loader from "./Loader";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  isPending?: boolean;
  /** Red confirm button. On by default — almost every use is a delete. */
  destructive?: boolean;
}

/**
 * One dialog for every destructive confirmation in the app.
 *
 * The implementation this replaces inlined its own AlertDialog in a dozen
 * components, which is how three of them ended up with no pending state and
 * one with a confirm button that stayed enabled through the request.
 */
const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pendingLabel = "Deleting...",
  isPending = false,
  destructive = true,
}: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="text-sm text-muted-foreground">{description}</div>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          disabled={isPending}
          className={cn(
            destructive && "bg-destructive text-white hover:bg-destructive/90",
          )}
          // The dialog must stay open while the request is in flight, or a
          // failure has nowhere to report itself.
          onClick={(event) => {
            event.preventDefault();
            onConfirm();
          }}
        >
          {isPending ? (
            <>
              <Loader size={16} onDark label={pendingLabel} />
              <span className="animate-pulse">{pendingLabel}</span>
            </>
          ) : (
            confirmLabel
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDialog;
