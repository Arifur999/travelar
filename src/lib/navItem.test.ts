import { describe, expect, it } from "vitest";
import {
  agencyNavGroups,
  findNavItemByPath,
  flattenNavItems,
  isNavItemActive,
  isNavSectionLocked,
  type NavItem,
} from "./navItem";
import { PLAN_FEATURES, type PlanFeature } from "@/types/enums.types";

const everyItem = () =>
  agencyNavGroups
    .flatMap((group) => group.items)
    .flatMap((item) => [item, ...(item.children ?? [])]);

const find = (title: string): NavItem => {
  const hit = everyItem().find((item) => item.title === title);

  if (!hit) throw new Error(`no nav item titled ${title}`);
  return hit;
};

/** Titles repeat across sections — Ledger and Dashboard both do — so
 * anything about one specific entry looks it up by href. */
const findByHref = (href: string): NavItem => {
  const hit = everyItem().find((item) => item.href === href);

  if (!hit) throw new Error(`no nav item for ${href}`);
  return hit;
};

describe("flattenNavItems", () => {
  it("returns pages, not the sections that hold them", () => {
    const titles = flattenNavItems(agencyNavGroups, "AGENCY_ADMIN").map((item) => item.title);

    expect(titles).toContain("Air Tickets");
    expect(titles).toContain("Ledger");
    // A section is a header in the sidebar, so it must never be treated as a page.
    expect(titles).not.toContain("Travel Services");
    expect(titles).not.toContain("Accounts");
  });

  it("drops what the role cannot see", () => {
    const staff = flattenNavItems(agencyNavGroups, "AGENCY_STAFF").map((item) => item.title);

    expect(staff).not.toContain("Capital");
    expect(staff).not.toContain("Employees");
    expect(staff).toContain("Air Tickets");
  });
});

describe("the menu as a whole", () => {
  it("still reaches every page after a reshuffle", () => {
    // Moving items between sections is a rename away from quietly dropping
    // one, and a page nothing links to is a page nobody finds.
    const hrefs = flattenNavItems(agencyNavGroups, "AGENCY_ADMIN").map((item) => item.href);

    for (const href of [
      "/dashboard",
      "/dashboard/reports",
      "/dashboard/tickets",
      "/dashboard/visa",
      "/dashboard/tours",
      "/dashboard/hotels",
      "/dashboard/hajj",
      "/dashboard/hajj/packages",
      "/dashboard/customers",
      "/dashboard/customers/list",
      "/dashboard/customers/ledger",
      "/dashboard/collections",
      "/dashboard/suppliers",
      "/dashboard/suppliers/list",
      "/dashboard/suppliers/transactions",
      "/dashboard/transfers",
      "/dashboard/accounts",
      "/dashboard/wallet",
      "/dashboard/expenses",
      "/dashboard/expenses/categories",
      "/dashboard/expenses/transactions",
      "/dashboard/capital",
      "/dashboard/employees",
      "/dashboard/employees/transactions",
      "/dashboard/employees/attendance",
      "/dashboard/employees/list",
      "/dashboard/airlines",
      "/dashboard/routes",
      "/dashboard/team",
      "/dashboard/settings",
      "/dashboard/billing",
      "/dashboard/previous-data",
      "/dashboard/support",
      "/dashboard/announcements",
    ]) {
      expect(hrefs, `${href} is no longer in the menu`).toContain(href);
    }
  });
});

describe("isNavSectionLocked", () => {
  const without = (feature: PlanFeature): PlanFeature[] =>
    PLAN_FEATURES.filter((item) => item !== feature);

  it("keeps a section open while one page inside it is still included", () => {
    // Accounts carries the expenses feature, but Wallet inside it is a base
    // feature — locking the section would put Wallet behind an upgrade the
    // agency does not have to buy.
    expect(isNavSectionLocked(find("Accounts"), without("EXPENSE"), "AGENCY_ADMIN")).toBe(false);
  });

  it("locks a section once every page inside it is out of the plan", () => {
    const suppliers = findByHref("/dashboard/suppliers");

    expect(isNavSectionLocked(suppliers, without("EXPENSE"), "AGENCY_ADMIN")).toBe(true);
    expect(isNavSectionLocked(suppliers, [...PLAN_FEATURES], "AGENCY_ADMIN")).toBe(false);
  });

  it("says nothing about a page, which has no inside to judge", () => {
    expect(isNavSectionLocked(find("Capital"), [], "AGENCY_ADMIN")).toBe(false);
  });

  it("ignores pages the role cannot see", () => {
    // Staff see three of Setup's five entries, and none of them is gated on
    // a feature, so the section stays open for them.
    expect(isNavSectionLocked(find("Setup"), [], "AGENCY_STAFF")).toBe(false);
  });
});

describe("isNavItemActive", () => {
  it("lights a section through its children", () => {
    const accounts = find("Accounts");

    expect(isNavItemActive(accounts, "/dashboard/transfers")).toBe(true);
    expect(isNavItemActive(accounts, "/dashboard/accounts")).toBe(true);
    expect(isNavItemActive(accounts, "/dashboard/expenses")).toBe(false);
  });

  it("never lights a module that is not built yet", () => {
    // Every module in the menu is built today, so this is written against a
    // made-up one: the rule has to keep working for the next module that is
    // announced before its page exists, whose href can only 404.
    const soon: NavItem = {
      title: "Something new",
      href: "/dashboard/something-new",
      icon: find("Wallet").icon,
      soon: true,
    };

    expect(isNavItemActive(soon, "/dashboard/something-new")).toBe(false);
  });

  it("lights a module once it is built", () => {
    expect(isNavItemActive(find("Wallet"), "/dashboard/wallet")).toBe(true);
    expect(isNavItemActive(find("Tours"), "/dashboard/tours")).toBe(true);
    expect(isNavItemActive(find("Hotel"), "/dashboard/hotels")).toBe(true);
  });

  it("keeps an exact child off its siblings' pages", () => {
    const ledger = findByHref("/dashboard/accounts");

    expect(isNavItemActive(ledger, "/dashboard/accounts")).toBe(true);
    expect(isNavItemActive(ledger, "/dashboard/accounts/anything")).toBe(false);
  });

  it("matches a leaf on its own subtree", () => {
    const tickets = find("Air Tickets");

    expect(isNavItemActive(tickets, "/dashboard/tickets")).toBe(true);
    expect(isNavItemActive(tickets, "/dashboard/tickets/abc")).toBe(true);
    expect(isNavItemActive(tickets, "/dashboard/ticketsx")).toBe(false);
  });
});

describe("findNavItemByPath", () => {
  it("names the page, not its section — that is the breadcrumb", () => {
    expect(findNavItemByPath("/dashboard/transfers", "AGENCY_ADMIN")?.title).toBe("Fund Transfer");
    // /dashboard/hajj is the Bookings page inside the Hajj & Umrah section,
    // and the title bar names the page you are on.
    expect(findNavItemByPath("/dashboard/hajj", "AGENCY_ADMIN")?.title).toBe("Bookings");
    expect(findNavItemByPath("/dashboard/hajj/packages", "AGENCY_ADMIN")?.title).toBe(
      "Packages",
    );
  });

  it("prefers the longest match", () => {
    expect(findNavItemByPath("/dashboard", "AGENCY_ADMIN")?.title).toBe("Dashboard");
    expect(findNavItemByPath("/dashboard/tickets/new", "AGENCY_ADMIN")?.title).toBe("Air Tickets");
  });

  it("returns null for a page outside the sidebar", () => {
    expect(findNavItemByPath("/dashboard/nowhere", "AGENCY_ADMIN")).toBeNull();
  });
});
