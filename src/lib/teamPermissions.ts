import { type UserRole } from "@/types/enums.types";
import { type ITeamMember } from "@/types/team.types";

export interface TeamViewer {
  id: string;
  role: UserRole;
  /** From the agency profile's `team.ownerId`, so it is right on any page of rows. */
  isOwner: boolean;
}

/**
 * Mirrors TeamService.assertCanManage on the API, so the UI can explain a
 * refusal up front instead of letting someone fill a form the server rejects.
 * The API stays the authority — this only decides what to disable.
 *
 * Returns why the viewer cannot manage this member, or null when they can.
 */
export const getManageBlocker = (viewer: TeamViewer, member: ITeamMember): string | null => {
  if (viewer.role !== "AGENCY_ADMIN") return "Only agency admins can change team members.";
  if (member.id === viewer.id) {
    return "This is you. Change your name on My profile and your password on Change password.";
  }
  if (member.isOwner) return "The agency owner's account can only be changed by platform support.";
  if (member.role === "AGENCY_ADMIN" && !viewer.isOwner) {
    return "Only the agency owner can manage other admins.";
  }
  return null;
};

/** Making someone an admin — on create or by role change — is owner-only. */
export const canGrantAdmin = (viewer: TeamViewer) => viewer.isOwner;

/**
 * A readable temporary password: no 0/O or 1/l/I, so it survives being read
 * aloud or copied off a screen. Drawn from the Web Crypto API, not
 * Math.random, since it guards a real account until first login.
 */
export const generateTemporaryPassword = (length = 12) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
};
