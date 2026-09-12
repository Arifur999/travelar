"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Loader from "../Loader";

interface AppSubmitButtonProps {
  isPending: boolean;
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Full width by default because most forms here are a single column; modals
 * pass `className="w-auto"` to sit in a dialog footer.
 */
const AppSubmitButton = ({
  isPending,
  children,
  pendingLabel,
  className,
  disabled,
}: AppSubmitButtonProps) => (
  <Button type="submit" disabled={isPending || disabled} className={cn("w-full", className)}>
    {isPending ? (
      <>
        <Loader size={16} onDark label={pendingLabel ?? "Submitting"} />
        <span className="animate-pulse">{pendingLabel ?? "Submitting..."}</span>
      </>
    ) : (
      children
    )}
  </Button>
);

export default AppSubmitButton;
