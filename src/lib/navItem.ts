import {
  RiArrowLeftRightLine,
  RiBankCardLine,
  RiBankLine,
  RiBarChartLine,
  RiBuilding2Line,
  RiCalendarCheckLine,
  RiCashLine,
  RiDashboardLine,
  RiEqualizerLine,
  RiFileExcel2Line,
  RiFileList2Line,
  RiFlightTakeoffLine,
  RiFundsBoxLine,
  RiGroupLine,
  RiHandCoinLine,
  RiHotelBedLine,
  RiIdCardLine,
  RiLifebuoyLine,
  RiMegaphoneLine,
  RiMoonClearLine,
  RiPassportLine,
  RiPlaneLine,
  RiPriceTag3Line,
  RiReceiptLine,
  RiRoadMapLine,
  RiRouteLine,
  RiSettings3Line,
  RiStackLine,
  RiSuitcase2Line,
  RiTruckLine,
  RiUserSettingsLine,
  RiWallet3Line,
  type RemixiconComponentType,
} from "@remixicon/react";
import { type PlanFeature, type UserRole } from "@/types/enums.types";

export interface NavItem {
  title: string;
  href: string;
  icon: RemixiconComponentType;
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
 *   TOURS      → /tours
 *   HOTEL      → /hotels
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
      { title: "Dashboard", href: "/dashboard", icon: RiDashboardLine, exact: true },
      { title: "Reports", href: "/dashboard/reports", icon: RiBarChartLine, feature: "REPORTS" },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        title: "Travel Services",
        href: "/dashboard/travel-services",
        icon: RiSuitcase2Line,
        children: [
          { title: "Air Tickets", href: "/dashboard/tickets", icon: RiPlaneLine, feature: "TICKETING" },
          { title: "Visa", href: "/dashboard/visa", icon: RiPassportLine, feature: "VISA" },
          { title: "Tours", href: "/dashboard/tours", icon: RiRoadMapLine, feature: "TOURS" },
          { title: "Hotel", href: "/dashboard/hotels", icon: RiHotelBedLine, feature: "HOTEL" },
        ],
      },
      {
        // Its own section, not a travel service: an agency that runs Hajj
        // runs it as a business of its own, with packages and departures to
        // set up before a single pilgrim can be booked.
        title: "Hajj & Umrah",
        href: "/dashboard/hajj",
        icon: RiMoonClearLine,
        feature: "HAJJ_UMRAH",
        children: [
          {
            title: "Packages",
            href: "/dashboard/hajj/packages",
            icon: RiStackLine,
            feature: "HAJJ_UMRAH",
          },
          {
            title: "Bookings",
            href: "/dashboard/hajj",
            icon: RiMoonClearLine,
            feature: "HAJJ_UMRAH",
            exact: true,
          },
        ],
      },
      {
        // The customer side of the book: what they owe in total, the money
        // coming in against it, who they are, and the statement behind any
        // one balance.
        title: "Customers",
        href: "/dashboard/customers",
        icon: RiGroupLine,
        children: [
          {
            title: "Dashboard",
            href: "/dashboard/customers",
            icon: RiDashboardLine,
            exact: true,
          },
          { title: "Collections", href: "/dashboard/collections", icon: RiHandCoinLine },
          { title: "Clients List", href: "/dashboard/customers/list", icon: RiGroupLine },
          { title: "Ledger", href: "/dashboard/customers/ledger", icon: RiFileList2Line },
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
        icon: RiBankLine,
        feature: "EXPENSE",
        children: [
          {
            title: "Fund Transfer",
            href: "/dashboard/transfers",
            icon: RiArrowLeftRightLine,
            feature: "EXPENSE",
          },
          {
            title: "Ledger",
            href: "/dashboard/accounts",
            icon: RiFileList2Line,
            feature: "EXPENSE",
            exact: true,
          },
          { title: "Wallet", href: "/dashboard/wallet", icon: RiWallet3Line },
        ],
      },
      {
        title: "Expenses",
        href: "/dashboard/expenses",
        icon: RiReceiptLine,
        feature: "EXPENSE",
        children: [
          {
            title: "Dashboard",
            href: "/dashboard/expenses",
            icon: RiDashboardLine,
            feature: "EXPENSE",
            exact: true,
          },
          {
            title: "Category",
            href: "/dashboard/expenses/categories",
            icon: RiPriceTag3Line,
            feature: "EXPENSE",
          },
          {
            title: "Transactions",
            href: "/dashboard/expenses/transactions",
            icon: RiReceiptLine,
            feature: "EXPENSE",
          },
        ],
      },
      {
        title: "Capital",
        href: "/dashboard/capital",
        icon: RiFundsBoxLine,
        feature: "EXPENSE",
        roles: ["AGENCY_ADMIN"],
      },
    ],
  },
  {
    label: "People and partners",
    items: [
      {
        // The buying side, laid out like the customer side: the totals, the
        // money going out against them, and who they are.
        title: "Supplier",
        href: "/dashboard/suppliers",
        icon: RiTruckLine,
        feature: "EXPENSE",
        children: [
          {
            title: "Dashboard",
            href: "/dashboard/suppliers",
            icon: RiDashboardLine,
            feature: "EXPENSE",
            exact: true,
          },
          {
            title: "Transactions",
            href: "/dashboard/suppliers/transactions",
            icon: RiCashLine,
            feature: "EXPENSE",
          },
          {
            title: "Supplier List",
            href: "/dashboard/suppliers/list",
            icon: RiTruckLine,
            feature: "EXPENSE",
          },
        ],
      },
      {
        title: "Employees",
        href: "/dashboard/employees",
        icon: RiIdCardLine,
        feature: "EXPENSE",
        roles: ["AGENCY_ADMIN"],
        children: [
          {
            title: "Dashboard",
            href: "/dashboard/employees",
            icon: RiDashboardLine,
            feature: "EXPENSE",
            roles: ["AGENCY_ADMIN"],
            exact: true,
          },
          {
            title: "Transactions",
            href: "/dashboard/employees/transactions",
            icon: RiCashLine,
            feature: "EXPENSE",
            roles: ["AGENCY_ADMIN"],
          },
          {
            title: "Attendance",
            href: "/dashboard/employees/attendance",
            icon: RiCalendarCheckLine,
            feature: "EXPENSE",
            roles: ["AGENCY_ADMIN"],
          },
          {
            title: "Employees List",
            href: "/dashboard/employees/list",
            icon: RiIdCardLine,
            feature: "EXPENSE",
            roles: ["AGENCY_ADMIN"],
          },
        ],
      },
    ],
  },
  {
    label: "Setup",
    items: [
      {
        // Five pages that are set up once and then left alone. Loose at the
        // top level they were a third of the menu, sitting between the
        // person and the pages they open twenty times a day.
        title: "Setup",
        href: "/dashboard/setup",
        icon: RiEqualizerLine,
        children: [
          {
            title: "Airlines",
            href: "/dashboard/airlines",
            icon: RiFlightTakeoffLine,
            feature: "TICKETING",
          },
          { title: "Routes", href: "/dashboard/routes", icon: RiRouteLine, feature: "TICKETING" },
          // Visible to staff too: they can see who their teammates are, and
          // the page hides every change they are not allowed to make.
          { title: "Team", href: "/dashboard/team", icon: RiUserSettingsLine },
          {
            title: "Agency profile",
            href: "/dashboard/settings",
            icon: RiSettings3Line,
            roles: ["AGENCY_ADMIN"],
          },
          {
            title: "Billing",
            href: "/dashboard/billing",
            icon: RiBankCardLine,
            roles: ["AGENCY_ADMIN"],
          },
          {
            // Where an agency moving off a spreadsheet starts, so it sits
            // with the rest of the once-only setup rather than in the
            // day-to-day menu.
            title: "Previous data",
            href: "/dashboard/previous-data",
            icon: RiFileExcel2Line,
            roles: ["AGENCY_ADMIN"],
          },
        ],
      },
      {
        title: "Help",
        href: "/dashboard/help",
        icon: RiLifebuoyLine,
        children: [
          { title: "Support", href: "/dashboard/support", icon: RiLifebuoyLine },
          { title: "Announcements", href: "/dashboard/announcements", icon: RiMegaphoneLine },
        ],
      },
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
      { title: "Overview", href: "/admin/dashboard", icon: RiDashboardLine, exact: true },
      { title: "Agencies", href: "/admin/dashboard/agencies", icon: RiBuilding2Line },
      { title: "Plans", href: "/admin/dashboard/plans", icon: RiStackLine },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Support", href: "/admin/dashboard/support", icon: RiLifebuoyLine },
      { title: "Announcements", href: "/admin/dashboard/announcements", icon: RiMegaphoneLine },
      { title: "Activity log", href: "/admin/dashboard/activity", icon: RiFileList2Line },
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
 * A section is locked only when every page inside it is, because a section
 * that still leads somewhere must stay open.
 *
 * Accounts is the case that matters: it carries the expenses feature, but
 * Wallet inside it is a base feature on every plan. Locking the section on
 * its own flag would put Wallet behind an upgrade nobody has to buy.
 */
export const isNavSectionLocked = (
  item: NavItem,
  features: PlanFeature[],
  role: UserRole,
): boolean => {
  const reachable = (item.children ?? []).filter((child) =>
    isNavItemVisibleToRole(child, role),
  );

  return reachable.length > 0 && reachable.every((child) => isNavItemLocked(child, features));
};

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
