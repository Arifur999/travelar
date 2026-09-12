"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Plane } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getDefaultDashboardRoute,
} from "@/lib/authUtils";
import {
  getNavGroupsForRole,
  isNavItemActive,
  isNavItemLocked,
  isNavItemVisibleToRole,
} from "@/lib/navItem";
import { PLAN_FEATURE_LABELS, type PlanFeature } from "@/types/enums.types";
import { type IUser } from "@/types/user.types";

/**
 * Client component by design, and it imports the nav config directly rather
 * than receiving it as props.
 *
 * That is why there is no `iconMapper` here: the reference implementation
 * passes nav items from a Server Component, which forces icons to be strings
 * because a React component is not serializable. Importing the config on the
 * client instead keeps the icons as real components and type-checked. Only
 * `userInfo` and `features` — both plain JSON — cross the boundary.
 */
interface DashboardSidebarProps {
  userInfo: IUser;
  features: PlanFeature[];
}

const DashboardSidebar = ({ userInfo, features }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const groups = getNavGroupsForRole(userInfo.role);
  const home = getDefaultDashboardRoute(userInfo.role);

  // On mobile the sidebar is a sheet; without this it stays open over the page
  // the user just navigated to.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Travelar">
              <Link href={home} onClick={closeOnMobile}>
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Plane className="size-4" aria-hidden="true" />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Travelar</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userInfo.agency?.name ?? "Platform console"}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            isNavItemVisibleToRole(item, userInfo.role),
          );

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavItemActive(item, pathname);
                    const isLocked = isNavItemLocked(item, features);

                    // A locked module stays visible but routes to billing
                    // instead of a page the API would refuse with a 403.
                    // Hiding it would make the product look like it lacks the
                    // module; showing it locked makes the upgrade findable.
                    if (isLocked) {
                      return (
                        <SidebarMenuItem key={item.href}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                className="text-muted-foreground/70"
                                tooltip={undefined}
                              >
                                <Link
                                  href="/dashboard/billing"
                                  onClick={closeOnMobile}
                                  aria-label={`${item.title} — locked, upgrade required`}
                                >
                                  <Icon aria-hidden="true" />
                                  <span className="flex-1 truncate">{item.title}</span>
                                  <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {PLAN_FEATURE_LABELS[item.feature as PlanFeature]} is not in your
                              plan — upgrade to unlock
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                          <Link href={item.href} onClick={closeOnMobile}>
                            <Icon aria-hidden="true" />
                            <span className="truncate">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Signed in as {userInfo.name}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default DashboardSidebar;
