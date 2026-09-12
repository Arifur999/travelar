import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";

interface PersonCellProps {
  name: string;
  /** Second line: an email, a phone, a passport number. */
  secondary?: string | null;
  showAvatar?: boolean;
}

const PersonCell = ({ name, secondary, showAvatar = true }: PersonCellProps) => (
  <div className="flex items-center gap-2">
    {showAvatar && (
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
    )}
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{name}</p>
      {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
    </div>
  </div>
);

export default PersonCell;
