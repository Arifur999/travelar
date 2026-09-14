"use server";

import { httpClient } from "@/lib/axios/httpClient";
import { type IUser } from "@/types/user.types";
import {
  type IAgencyProfile,
  type ICreateTeamMemberPayload,
  type IResetTeamMemberPasswordPayload,
  type ITeamMember,
  type IUpdateAgencyProfilePayload,
  type IUpdateMyProfilePayload,
  type IUpdateTeamMemberPayload,
  type IUpdateTeamMemberStatusPayload,
} from "@/types/team.types";

/* ---------------------------------- team --------------------------------- */

export const getTeamMembers = async (queryString?: string) => {
  try {
    return await httpClient.get<ITeamMember[]>(`/team${queryString ? `?${queryString}` : ""}`);
  } catch (error) {
    console.error("Error fetching the team:", error);
    throw error;
  }
};

export const createTeamMember = async (payload: ICreateTeamMemberPayload) => {
  try {
    return await httpClient.post<ITeamMember>("/team", payload);
  } catch (error) {
    console.error("Error adding a team member:", error);
    throw error;
  }
};

export const updateTeamMember = async (id: string, payload: IUpdateTeamMemberPayload) => {
  try {
    return await httpClient.patch<ITeamMember>(`/team/${id}`, payload);
  } catch (error) {
    console.error("Error updating a team member:", error);
    throw error;
  }
};

export const updateTeamMemberStatus = async (id: string, payload: IUpdateTeamMemberStatusPayload) => {
  try {
    return await httpClient.patch<ITeamMember>(`/team/${id}/status`, payload);
  } catch (error) {
    console.error("Error changing a team member's status:", error);
    throw error;
  }
};

export const resetTeamMemberPassword = async (
  id: string,
  payload: IResetTeamMemberPasswordPayload,
) => {
  try {
    return await httpClient.patch<null>(`/team/${id}/reset-password`, payload);
  } catch (error) {
    console.error("Error resetting a password:", error);
    throw error;
  }
};

export const removeTeamMember = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/team/${id}`);
  } catch (error) {
    console.error("Error removing a team member:", error);
    throw error;
  }
};

/* ----------------------------- agency profile ---------------------------- */

export const getAgencyProfile = async () => {
  try {
    return await httpClient.get<IAgencyProfile>("/agency/profile");
  } catch (error) {
    console.error("Error fetching the agency profile:", error);
    throw error;
  }
};

export const updateAgencyProfile = async (payload: IUpdateAgencyProfilePayload) => {
  try {
    return await httpClient.patch<IAgencyProfile>("/agency/profile", payload);
  } catch (error) {
    console.error("Error updating the agency profile:", error);
    throw error;
  }
};

/* ------------------------------- my profile ------------------------------ */

/**
 * Lives here rather than in auth.services, whose functions are deliberately
 * raw fetch to stay clear of token refresh. Renaming yourself is an ordinary
 * authenticated call and can go through httpClient.
 */
export const updateMyProfile = async (payload: IUpdateMyProfilePayload) => {
  try {
    return await httpClient.patch<IUser>("/auth/me", payload);
  } catch (error) {
    console.error("Error updating your profile:", error);
    throw error;
  }
};
