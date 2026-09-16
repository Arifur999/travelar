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
  return await httpClient.get<ITeamMember[]>(`/team${queryString ? `?${queryString}` : ""}`);
};

export const createTeamMember = async (payload: ICreateTeamMemberPayload) => {
  return await httpClient.post<ITeamMember>("/team", payload);
};

export const updateTeamMember = async (id: string, payload: IUpdateTeamMemberPayload) => {
  return await httpClient.patch<ITeamMember>(`/team/${id}`, payload);
};

export const updateTeamMemberStatus = async (id: string, payload: IUpdateTeamMemberStatusPayload) => {
  return await httpClient.patch<ITeamMember>(`/team/${id}/status`, payload);
};

export const resetTeamMemberPassword = async (
  id: string,
  payload: IResetTeamMemberPasswordPayload,
) => {
  return await httpClient.patch<null>(`/team/${id}/reset-password`, payload);
};

export const removeTeamMember = async (id: string) => {
  return await httpClient.delete<null>(`/team/${id}`);
};

/* ----------------------------- agency profile ---------------------------- */

export const getAgencyProfile = async () => {
  return await httpClient.get<IAgencyProfile>("/agency/profile");
};

export const updateAgencyProfile = async (payload: IUpdateAgencyProfilePayload) => {
  return await httpClient.patch<IAgencyProfile>("/agency/profile", payload);
};

/* ------------------------------- my profile ------------------------------ */

/**
 * Lives here rather than in auth.services, whose functions are deliberately
 * raw fetch to stay clear of token refresh. Renaming yourself is an ordinary
 * authenticated call and can go through httpClient.
 */
export const updateMyProfile = async (payload: IUpdateMyProfilePayload) => {
  return await httpClient.patch<IUser>("/auth/me", payload);
};
