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
  try {
    return await httpClient.get<ISupportTicket[]>(
      `/support/tickets${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    throw error;
  }
};

export const getTicketById = async (id: string) => {
  try {
    return await httpClient.get<ISupportTicketDetail>(`/support/tickets/${id}`);
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    throw error;
  }
};

export const createSupportTicket = async (payload: ICreateSupportTicketPayload) => {
  try {
    return await httpClient.post<ISupportTicket>("/support/tickets", payload);
  } catch (error) {
    console.error("Error creating support ticket:", error);
    throw error;
  }
};

export const addTicketMessage = async (id: string, payload: IAddMessagePayload) => {
  try {
    return await httpClient.post<ISupportTicketDetail>(
      `/support/tickets/${id}/messages`,
      payload,
    );
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const getMyAnnouncements = async () => {
  try {
    return await httpClient.get<IAnnouncement[]>("/support/announcements");
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error;
  }
};

export const markAnnouncementRead = async (id: string) => {
  try {
    return await httpClient.post<null>(`/support/announcements/${id}/read`);
  } catch (error) {
    console.error("Error marking announcement read:", error);
    throw error;
  }
};

/* ----------------------------- operator side ----------------------------- */

/** SUPER_ADMIN only. Unscoped — every agency's threads. */
export const getAllTickets = async (queryString?: string) => {
  try {
    return await httpClient.get<ISupportTicket[]>(
      `/admin/tickets${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching tickets:", error);
    throw error;
  }
};

export const getAdminTicketById = async (id: string) => {
  try {
    return await httpClient.get<ISupportTicketDetail>(`/admin/tickets/${id}`);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    throw error;
  }
};

export const addAdminTicketMessage = async (id: string, payload: IAddMessagePayload) => {
  try {
    return await httpClient.post<ISupportTicketDetail>(`/admin/tickets/${id}/messages`, payload);
  } catch (error) {
    console.error("Error sending reply:", error);
    throw error;
  }
};

export const updateTicketStatus = async (
  id: string,
  payload: IUpdateTicketStatusPayload,
) => {
  try {
    return await httpClient.patch<ISupportTicketDetail>(`/admin/tickets/${id}/status`, payload);
  } catch (error) {
    console.error("Error updating ticket status:", error);
    throw error;
  }
};

export const getAdminAnnouncements = async (queryString?: string) => {
  try {
    return await httpClient.get<IAnnouncement[]>(
      `/admin/announcements${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error;
  }
};

export const createAnnouncement = async (payload: ICreateAnnouncementPayload) => {
  try {
    return await httpClient.post<IAnnouncement>("/admin/announcements", payload);
  } catch (error) {
    console.error("Error creating announcement:", error);
    throw error;
  }
};

export const updateAnnouncement = async (
  id: string,
  payload: IUpdateAnnouncementPayload,
) => {
  try {
    return await httpClient.patch<IAnnouncement>(`/admin/announcements/${id}`, payload);
  } catch (error) {
    console.error("Error updating announcement:", error);
    throw error;
  }
};
