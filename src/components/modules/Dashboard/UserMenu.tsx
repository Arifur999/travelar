"use client";

import { useTransition } from "react";
import Link from "next/link";
import { KeyRound, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/format";
import { logoutAction } from "@/services/auth.services";
import { USER_ROLE_LABELS } from "@/types/enums.types";
import { type IUser } from "@/types/user.types";

const UserMenu = ({ userInfo }: { userInfo: IUser }) => {
  // logoutAction ends in redirect(), so it never resolves normally. A
  // transition keeps the button responsive rather than leaving an await that
  // by design never returns.
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-9 rounded-full" aria-label="Account menu">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {getInitials(userInfo.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">{userInfo.name}</p>
            <p className="truncate text-xs leading-none text-muted-foreground">{userInfo.email}</p>
            <p className="pt-1 text-xs leading-none text-muted-foreground">
              {USER_ROLE_LABELS[userInfo.role]}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/my-profile">
            <User className="size-4" aria-hidden="true" />
            My profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/change-password">
            <KeyRound className="size-4" aria-hidden="true" />
            Change password
          </Link>
        </DropdownMenuItem>

        {userInfo.role === "AGENCY_ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="size-4" aria-hidden="true" />
              Agency profile
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => {
              void logoutAction();
            });
          }}
        >
          <LogOut className="size-4" aria-hidden="true" />
          {isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
