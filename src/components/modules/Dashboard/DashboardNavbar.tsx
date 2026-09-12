"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { findNavItemByPath } from "@/lib/navItem";
import { type IUser } from "@/types/user.types";
import UserMenu from "./UserMenu";

/**
 * The page title comes from the nav config rather than being passed down by
 * each page, so a route and its heading can never disagree.
 */
const DashboardNavbar = ({ userInfo }: { userInfo: IUser }) => {
  const pathname = usePathname();
  const current = findNavItemByPath(pathname, userInfo.role);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />

      <h1 className="truncate text-base font-semibold">{current?.title ?? "Dashboard"}</h1>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu userInfo={userInfo} />
      </div>
    </header>
  );
};

export default DashboardNavbar;
