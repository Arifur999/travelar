import { describe, expect, it } from "vitest";
import { type ITeamMember } from "@/types/team.types";
import { canGrantAdmin, generateTemporaryPassword, getManageBlocker, type TeamViewer } from "./teamPermissions";

/**
 * These must mirror TeamService.assertCanManage on the API. If they drift, the
 * UI either offers an action the API refuses or hides one it would allow.
 */

const member = (overrides: Partial<ITeamMember>): ITeamMember => ({
  id: "member",
  name: "Member",
  email: "member@example.test",
  role: "AGENCY_STAFF",
  status: "ACTIVE",
  needPasswordChange: false,
  isOwner: false,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
  ...overrides,
});

const owner: TeamViewer = { id: "owner", role: "AGENCY_ADMIN", isOwner: true };
const admin: TeamViewer = { id: "admin", role: "AGENCY_ADMIN", isOwner: false };
const staff: TeamViewer = { id: "staff", role: "AGENCY_STAFF", isOwner: false };

describe("getManageBlocker", () => {
  it("lets the owner manage staff and other admins", () => {
    expect(getManageBlocker(owner, member({ role: "AGENCY_STAFF" }))).toBeNull();
    expect(getManageBlocker(owner, member({ role: "AGENCY_ADMIN" }))).toBeNull();
  });

  it("lets a non-owner admin manage staff only", () => {
    expect(getManageBlocker(admin, member({ role: "AGENCY_STAFF" }))).toBeNull();
    expect(getManageBlocker(admin, member({ role: "AGENCY_ADMIN" }))).toMatch(/owner/i);
  });

  it("never lets anyone manage the owner", () => {
    expect(getManageBlocker(admin, member({ id: "owner", role: "AGENCY_ADMIN", isOwner: true }))).toMatch(/owner/i);
  });

  it("never lets anyone manage themselves, owner included", () => {
    expect(getManageBlocker(owner, member({ id: "owner", role: "AGENCY_ADMIN", isOwner: true }))).toMatch(/you/i);
    expect(getManageBlocker(admin, member({ id: "admin", role: "AGENCY_ADMIN" }))).toMatch(/you/i);
  });

  it("gives staff no management at all", () => {
    expect(getManageBlocker(staff, member({ role: "AGENCY_STAFF" }))).toMatch(/admins/i);
  });
});

describe("canGrantAdmin", () => {
  it("is the owner's alone", () => {
    expect(canGrantAdmin(owner)).toBe(true);
    expect(canGrantAdmin(admin)).toBe(false);
    expect(canGrantAdmin(staff)).toBe(false);
  });
});

describe("generateTemporaryPassword", () => {
  it("meets the API's 8-character minimum by default", () => {
    expect(generateTemporaryPassword()).toHaveLength(12);
    expect(generateTemporaryPassword(20)).toHaveLength(20);
  });

  // It is read aloud or copied off a screen.
  it("never uses look-alike characters", () => {
    const sample = Array.from({ length: 200 }, () => generateTemporaryPassword()).join("");
    expect(sample).not.toMatch(/[0O1lI]/);
    expect(sample).toMatch(/^[A-Za-z2-9]+$/);
  });

  it("does not repeat", () => {
    const passwords = new Set(Array.from({ length: 500 }, () => generateTemporaryPassword()));
    expect(passwords.size).toBe(500);
  });
});
