import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type BadgeTone } from "@/types/enums.types";

/**
 * Tone to class, in one place.
 *
 * The shadcn Badge ships default / secondary / destructive / outline only, so
 * the four status tones are painted from the semantic tokens in globals.css
 * rather than by adding variants to a generated file (which the next
 * `shadcn add` would overwrite).
 */
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-transparent bg-muted text-muted-foreground",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  info: "border-info/20 bg-info/10 text-info",
};

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

const StatusBadge = ({ label, tone = "neutral", className }: StatusBadgeProps) => (
  <Badge variant="outline" className={cn(TONE_CLASSES[tone], className)}>
    {label}
  </Badge>
);

export default StatusBadge;
