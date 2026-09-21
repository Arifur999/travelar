import { describe, expect, it } from "vitest";
import {
  agencyNavGroups,
  findNavItemByPath,
  flattenNavItems,
  isNavItemActive,
  type NavItem,
} from "./navItem";

const find = (title: string): NavItem => {
  const hit = agencyNavGroups
    .flatMap((group) => group.items)
    .flatMap((item) => [item, ...(item.children ?? [])])
    .find((item) => item.title === title);

  if (!hit) throw new Error(`no nav item titled ${title}`);
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
    const ledger = find("Ledger");

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
    expect(findNavItemByPath("/dashboard/hajj", "AGENCY_ADMIN")?.title).toBe("Hajj & Umrah");
  });

  it("prefers the longest match", () => {
    expect(findNavItemByPath("/dashboard", "AGENCY_ADMIN")?.title).toBe("Dashboard");
    expect(findNavItemByPath("/dashboard/tickets/new", "AGENCY_ADMIN")?.title).toBe("Air Tickets");
  });

  it("returns null for a page outside the sidebar", () => {
    expect(findNavItemByPath("/dashboard/nowhere", "AGENCY_ADMIN")).toBeNull();
  });
});
