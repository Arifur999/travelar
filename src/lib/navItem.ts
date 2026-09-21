import {
  ArrowLeftRight,
  Banknote,
  BedDouble,
  Building2,
  CalendarCheck,
  ChartColumn,
  CreditCard,
  FileCheck,
  HandCoins,
  IdCard,
  Landmark,
  LayoutDashboard,
  Layers,
  LifeBuoy,
  Luggage,
  Map,
  Megaphone,
  MoonStar,
  PiggyBank,
  Plane,
  PlaneTakeoff,
  Receipt,
  Route,
  ScrollText,
  Settings,
  Tags,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { type PlanFeature, type UserRole } from "@/types/enums.types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /**
   * Submenu entries. A parent with children is not a link itself — the sidebar
   * turns it into a collapsible section, open while one of its children is the
   * page being viewed.
   */
  children?: NavItem[];
  /**
   * The module is not built yet. It is listed, greyed out and unclickable,
   * rather than hidden, so the sidebar shows what the product will have.
   */
  soon?: boolean;
  /**
   * The plan feature this module needs. Must match the `checkFeatureAccess`
   * call on the corresponding backend router — if they disagree, the sidebar
   * either hides a module the API would serve or offers one it will refuse
   * with a 403. Omit for a base feature available on every plan.
   */
  feature?: PlanFeature;
  /** Omit to mean "any agency role". */
  roles?: UserRole[];
  /**
   * Highlight only on an exact path match. Needed for the group landing pages
   * (`/dashboard`, `/admin/dashboard`), which are a prefix of every sibling.
   */
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The agency workspace, shared by AGENCY_ADMIN and AGENCY_STAFF.
 *
 * Feature keys below were read off the backend routers, not guessed:
 *   TICKETING  → /ticketing, /airlines, /routes-master
 *   VISA       → /visa
 *   HAJJ_UMRAH → /hajj
 *   EXPENSE    → /accounts, /balance-transfers, /suppliers,
 *                /supplier-transactions, /expenses, /capital, /employees
 *   REPORTS    → /dashboard/custom, /monthly, /yearly, /cash-flow
 *   (none)     → /customers, /due-received, /dashboard/summary,
 *                /team, /agency/profile
 *
 * Note: the backend PlanFeature enum also has CRM, but no router gates on it —
 * customers and collections are base features on purpose, since every other
 * module books against a customer. Nothing here claims CRM, so a plan selling
 * it unlocks nothing extra. Either drop it from the enum or give it something
 * to gate; until then it is inert.
 */
export const agencyNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { title: "Reports", href: "/dashboard/reports", icon: ChartColumn, feature: "REPORTS" },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        title: "Travel Services",
        href: "/dashboard/travel-services",
        icon: Luggage,
        children: [
          { title: "Air Tickets", href: "/dashboard/tickets", icon: Plane, feature: "TICKETING" },
          { title: "Visa", href: "/dashboard/visa", icon: FileCheck, feature: "VISA" },
          { title: "Tours", href: "/dashboard/tours", icon: Map, soon: true },
          { title: "Hotel", href: "/dashboard/hotels", icon: BedDouble, soon: true },
        ],
      },
      // Its own section rather than a travel service: it is sold, booked and
      // reported on differently, and it will grow its own pages.
      { title: "Hajj & Umrah", href: "/dashboard/hajj", icon: MoonStar, feature: "HAJJ_UMRAH" },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Customers", href: "/dashboard/customers", icon: Users },
      { title: "Collections", href: "/dashboard/collections", icon: HandCoins },
      { title: "Suppliers", href: "/dashboard/suppliers", icon: Truck, feature: "EXPENSE" },
      {
        title: "Supplier payments",
        href: "/dashboard/supplier-payments",
        icon: Banknote,
        feature: "EXPENSE",
      },
      {
        title: "Employees",
        href: "/dashboard/employees",
        icon: IdCard,
        feature: "EXPENSE",
        roles: ["AGENCY_ADMIN"],
        children: [
          {
            title: "Dashboard",
            href: "/dashboard/employees",
            icon: LayoutDashboard,
            feature: "EXPENSE",
            roles: ["AGENCY_ADMIN"],
            exact: true,
          },
          {
            title: "Transactions",
            href: "/dashboard/employees/transactions",
            icon: Banknote,
            feature: "EXPENSE",
            roles: ["AGENCY_ADMIN"],
          },
          {
            title: "Attendance",
            href: "/dashboard/employees/attendance",
            icon: CalendarCheck,
            feature: "EXPENSE",
            roles: ["AGENCY_ADMIN"],
          },
          {
            title: "Employees List",
            href: "/dashboard/employees/list",
            icon: IdCard,
            feature: "EXPENSE",
            roles: ["AGENCY_ADMIN"],
          },
        ],
      },
    ],
  },
  {
    label: "Money",
    items: [
      {
        title: "Accounts",
        href: "/dashboard/accounts",
        icon: Landmark,
        feature: "EXPENSE",
        children: [
          {
            title: "Fund Transfer",
            href: "/dashboard/transfers",
            icon: ArrowLeftRight,
            feature: "EXPENSE",
          },
          {
            title: "Ledger",
            href: "/dashboard/accounts",
            icon: ScrollText,
            feature: "EXPENSE",
            exact: true,
          },
          { title: "Wallet", href: "/dashboard/wallet", icon: Wallet },
        ],
      },
      {
        title: "Expenses",
        href: "/dashboard/expenses",
        icon: Receipt,
        feature: "EXPENSE",
        children: [
          {
            title: "Dashboard",
            href: "/dashboard/expenses",
            icon: LayoutDashboard,
            feature: "EXPENSE",
            exact: true,
          },
          {
            title: "Category",
            href: "/dashboard/expenses/categories",
            icon: Tags,
            feature: "EXPENSE",
          },
          {
            title: "Transactions",
            href: "/dashboard/expenses/transactions",
            icon: Receipt,
            feature: "EXPENSE",
          },
        ],
      },
      {
        title: "Capital",
        href: "/dashboard/capital",
        icon: PiggyBank,
        feature: "EXPENSE",
        roles: ["AGENCY_ADMIN"],
      },
    ],
  },
  {
    label: "Setup",
    items: [
      { title: "Airlines", href: "/dashboard/airlines", icon: PlaneTakeoff, feature: "TICKETING" },
      { title: "Routes", href: "/dashboard/routes", icon: Route, feature: "TICKETING" },
      // Visible to staff too: they can see who their teammates are, and the
      // page hides every change they are not allowed to make.
      { title: "Team", href: "/dashboard/team", icon: UserCog },
      {
        title: "Agency profile",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["AGENCY_ADMIN"],
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
        roles: ["AGENCY_ADMIN"],
      },
      { title: "Support", href: "/dashboard/support", icon: LifeBuoy },
      { title: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
    ],
  },
];

/**
 * The platform operator console. No feature keys — a SUPER_ADMIN is not a
 * tenant, so `checkFeatureAccess` and `requireActiveSubscription` both
 * short-circuit for this role.
 */
export const platformNavGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { title: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
      { title: "Agencies", href: "/admin/dashboard/agencies", icon: Building2 },
      { title: "Plans", href: "/admin/dashboard/plans", icon: Layers },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Support", href: "/admin/dashboard/support", icon: LifeBuoy },
      { title: "Announcements", href: "/admin/dashboard/announcements", icon: Megaphone },
      { title: "Activity log", href: "/admin/dashboard/activity", icon: ScrollText },
    ],
  },
];

export const getNavGroupsForRole = (role: UserRole): NavGroup[] =>
  role === "SUPER_ADMIN" ? platformNavGroups : agencyNavGroups;

export const isNavItemVisibleToRole = (item: NavItem, role: UserRole) =>
  !item.roles || item.roles.includes(role);

/**
 * Every item a role can reach, submenu entries included and parents left out —
 * a parent is a section header, not a page. Used by the landing page's quick
 * access grid and by the breadcrumb.
 */
export const flattenNavItems = (groups: NavGroup[], role: UserRole): NavItem[] =>
  groups
    .flatMap((group) => group.items)
    .filter((item) => isNavItemVisibleToRole(item, role))
    .flatMap((item) =>
      item.children
        ? item.children.filter((child) => isNavItemVisibleToRole(child, role))
        : [item],
    );

/**
 * A locked item is still rendered — greyed out, with a lock and a route to
 * billing — rather than hidden. Hiding it makes the product look like it lacks
 * the module; showing it locked makes the upgrade discoverable.
 *
 * `features` comes from GET /auth/my-features, which the backend derives
 * through the same code path as `checkFeatureAccess`, so this can never
 * disagree with what the API will actually serve.
 */
export const isNavItemLocked = (item: NavItem, features: PlanFeature[]) =>
  Boolean(item.feature) && !features.includes(item.feature as PlanFeature);

/**
 * Longest-prefix match, so `/dashboard/tickets/abc` highlights Tickets rather
 * than also lighting up every shorter sibling.
 */
export const isNavItemActive = (item: NavItem, pathname: string): boolean => {
  // A parent lights up through its children, never through its own href: two
  // sections can share a prefix (Accounts sits on /dashboard/accounts, whose
  // Ledger child is that exact page), and a soon item is no page at all.
  if (item.children) return item.children.some((child) => isNavItemActive(child, pathname));
  if (item.soon) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};

/** Drives the header breadcrumb and the document title. */
export const findNavItemByPath = (pathname: string, role: UserRole): NavItem | null => {
  const candidates = flattenNavItems(getNavGroupsForRole(role), role).filter((item) =>
    isNavItemActive(item, pathname),
  );

  if (candidates.length === 0) return null;

  return candidates.reduce((longest, item) =>
    item.href.length > longest.href.length ? item : longest,
  );
};
