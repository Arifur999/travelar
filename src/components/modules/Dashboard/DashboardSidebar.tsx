"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiArrowRightSLine, RiLockLine, RiPlaneLine } from "@remixicon/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  isNavSectionLocked,
  isNavItemVisibleToRole,
} from "@/lib/navItem";
import { type NavItem } from "@/lib/navItem";
import { cn } from "@/lib/utils";
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

/** Marks a module that is listed but not built yet. */
const SoonBadge = () => (
  <span className="shrink-0 rounded-sm bg-sidebar-accent px-1.5 py-0.5 text-[10px] leading-none font-medium tracking-wide text-sidebar-foreground/80 uppercase">
    Soon
  </span>
);

const DashboardSidebar = ({ userInfo, features }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const home = getDefaultDashboardRoute(userInfo.role);
  const visibleItems = getNavGroupsForRole(userInfo.role)
    .flatMap((group) => group.items)
    .filter((item) => isNavItemVisibleToRole(item, userInfo.role));

  // On mobile the sidebar is a sheet; without this it stays open over the page
  // the user just navigated to.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const lockedLabel = (item: NavItem) =>
    item.feature
      ? `${PLAN_FEATURE_LABELS[item.feature]} is not in your plan — upgrade to unlock`
      : "Nothing in this section is in your plan — upgrade to unlock";

  /** A top-level entry with no submenu. */
  const renderItem = (item: NavItem) => {
    const Icon = item.icon;

    if (item.soon) {
      return (
        <SidebarMenuButton
          disabled
          className="text-sidebar-foreground/70"
          tooltip={`${item.title} — coming soon`}
        >
          <Icon aria-hidden="true" />
          <span className="flex-1 truncate">{item.title}</span>
          <SoonBadge />
        </SidebarMenuButton>
      );
    }

    // A locked module stays visible but routes to billing instead of a page the
    // API would refuse with a 403. Hiding it would make the product look like
    // it lacks the module; showing it locked makes the upgrade findable.
    //
    // A section lands here too once everything inside it is locked, and it
    // must: its own href is a section id, not a page, so drawing it as an
    // ordinary link would send the click to a 404.
    if (isNavItemLocked(item, features) || isNavSectionLocked(item, features, userInfo.role)) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild className="text-sidebar-foreground/70" tooltip={undefined}>
              <Link
                href="/dashboard/billing"
                onClick={closeOnMobile}
                aria-label={`${item.title} — locked, upgrade required`}
              >
                <Icon aria-hidden="true" />
                <span className="flex-1 truncate">{item.title}</span>
                <RiLockLine className="size-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">{lockedLabel(item)}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <SidebarMenuButton asChild isActive={isNavItemActive(item, pathname)} tooltip={item.title}>
        <Link href={item.href} onClick={closeOnMobile}>
          <Icon aria-hidden="true" />
          <span className="truncate">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    );
  };

  /** A submenu entry. Same three states, drawn at submenu size. */
  const renderSubItem = (item: NavItem) => {
    if (item.soon) {
      return (
        <SidebarMenuSubButton
          aria-disabled="true"
          className="text-sidebar-foreground/70"
          title={`${item.title} — coming soon`}
        >
          <item.icon aria-hidden="true" />
          <span className="flex-1 truncate">{item.title}</span>
          <SoonBadge />
        </SidebarMenuSubButton>
      );
    }

    if (isNavItemLocked(item, features)) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuSubButton asChild className="text-sidebar-foreground/70">
              <Link
                href="/dashboard/billing"
                onClick={closeOnMobile}
                aria-label={`${item.title} — locked, upgrade required`}
              >
                <item.icon aria-hidden="true" />
                <span className="flex-1 truncate">{item.title}</span>
                <RiLockLine className="size-3.5 shrink-0" aria-hidden="true" />
              </Link>
            </SidebarMenuSubButton>
          </TooltipTrigger>
          <TooltipContent side="right">{lockedLabel(item)}</TooltipContent>
        </Tooltip>
      );
    }

    const Icon = item.icon;

    return (
      <SidebarMenuSubButton asChild isActive={isNavItemActive(item, pathname)}>
        <Link href={item.href} onClick={closeOnMobile}>
          <Icon aria-hidden="true" />
          <span className="truncate">{item.title}</span>
        </Link>
      </SidebarMenuSubButton>
    );
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Travelar">
              <Link href={home} onClick={closeOnMobile}>
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <RiPlaneLine className="size-4" aria-hidden="true" />
                </span>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Travelar</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {userInfo.agency?.name ?? "Platform console"}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* One list, no group headings: the sections carry the structure now,
            and a heading above every two or three of them was more furniture
            than signpost. */}
        <SidebarGroup>
          <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) =>
                    // A section whose every page is locked is drawn as one
                    // locked row: opening it to find nothing but locks is a
                    // worse answer than saying so on the row itself.
                    item.children && !isNavSectionLocked(item, features, userInfo.role) ? (
                      <Collapsible
                        key={item.href}
                        asChild
                        // Open on the section being viewed; closed sections stay
                        // out of the way. Uncontrolled, so a collapse the user
                        // makes by hand is not undone on every render.
                        defaultOpen={isNavItemActive(item, pathname)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={item.title}
                              isActive={isNavItemActive(item, pathname)}
                              // The section holding the current page reads as
                              // one solid block, so where you are is obvious
                              // even with several sections open.
                              className={cn(
                                isNavItemActive(item, pathname) &&
                                  "bg-sidebar-primary font-medium text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground",
                              )}
                            >
                              <item.icon aria-hidden="true" />
                              <span className="flex-1 truncate">{item.title}</span>
                              <RiArrowRightSLine
                                className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                aria-hidden="true"
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children
                                .filter((child) => isNavItemVisibleToRole(child, userInfo.role))
                                .map((child) => (
                                  <SidebarMenuSubItem key={child.href}>
                                    {renderSubItem(child)}
                                  </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      <SidebarMenuItem key={item.href}>{renderItem(item)}</SidebarMenuItem>
                    ),
                  )}
                </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          Signed in as {userInfo.name}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default DashboardSidebar;
