"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IAddMessagePayload,
  type IAnnouncement,
  type ICreateAnnouncementPayload,
  type ICreateSupportTicketPayload,
  type ISupportTicket,
  type ISupportTicketDetail,
  type IUpdateAnnouncementPayload,
  type IUpdateTicketStatusPayload,
} from "@/types/support.types";

/**
 * Support is never gated on a plan or an expiry — an agency whose subscription
 * has lapsed is exactly the one that needs to reach support.
 *
 * The tenant routes live under /support and the operator's under /admin, which
 * is what keeps an agency from reading another tenant's threads.
 */

/* ------------------------------ tenant side ------------------------------ */

export const getMyTickets = async (queryString?: string) => {
  return await httpClient.get<ISupportTicket[]>(
    `/support/tickets${queryString ? `?${queryString}` : ""}`,
  );
};

export const getTicketById = async (id: string) => {
  return await httpClient.get<ISupportTicketDetail>(`/support/tickets/${id}`);
};

export const createSupportTicket = async (payload: ICreateSupportTicketPayload) => {
  return await httpClient.post<ISupportTicket>("/support/tickets", payload);
};

export const addTicketMessage = async (id: string, payload: IAddMessagePayload) => {
  return await httpClient.post<ISupportTicketDetail>(
    `/support/tickets/${id}/messages`,
    payload,
  );
};

export const getMyAnnouncements = async () => {
  return await httpClient.get<IAnnouncement[]>("/support/announcements");
};

export const markAnnouncementRead = async (id: string) => {
  return await httpClient.post<null>(`/support/announcements/${id}/read`);
};

/* ----------------------------- operator side ----------------------------- */

/** SUPER_ADMIN only. Unscoped — every agency's threads. */
export const getAllTickets = async (queryString?: string) => {
  return await httpClient.get<ISupportTicket[]>(
    `/admin/tickets${queryString ? `?${queryString}` : ""}`,
  );
};

export const getAdminTicketById = async (id: string) => {
  return await httpClient.get<ISupportTicketDetail>(`/admin/tickets/${id}`);
};

export const addAdminTicketMessage = async (id: string, payload: IAddMessagePayload) => {
  return await httpClient.post<ISupportTicketDetail>(`/admin/tickets/${id}/messages`, payload);
};

export const updateTicketStatus = async (
  id: string,
  payload: IUpdateTicketStatusPayload,
) => {
  return await httpClient.patch<ISupportTicketDetail>(`/admin/tickets/${id}/status`, payload);
};

export const getAdminAnnouncements = async (queryString?: string) => {
  return await httpClient.get<IAnnouncement[]>(
    `/admin/announcements${queryString ? `?${queryString}` : ""}`,
  );
};

export const createAnnouncement = async (payload: ICreateAnnouncementPayload) => {
  return await httpClient.post<IAnnouncement>("/admin/announcements", payload);
};

export const updateAnnouncement = async (
  id: string,
  payload: IUpdateAnnouncementPayload,
) => {
  return await httpClient.patch<IAnnouncement>(`/admin/announcements/${id}`, payload);
};
