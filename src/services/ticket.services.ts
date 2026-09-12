"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IChangeTicketStatusPayload,
  type ICreateTicketPayload,
  type IDateChangePayload,
  type IRecordTicketPaymentPayload,
  type ITicket,
  type ITicketDetail,
  type ITicketsListResponse,
  type IUpdateTicketPayload,
} from "@/types/ticket.types";

/** Mounted at /ticketing, not /tickets. */
export const getTickets = async (queryString?: string) => {
  try {
    return await httpClient.get<ITicketsListResponse>(
      `/ticketing${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching tickets:", error);
    throw error;
  }
};

/** Includes payments and status history; the list endpoint does not. */
export const getTicketById = async (id: string) => {
  try {
    return await httpClient.get<ITicketDetail>(`/ticketing/${id}`);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    throw error;
  }
};

export const createTicket = async (payload: ICreateTicketPayload) => {
  try {
    return await httpClient.post<ITicket>("/ticketing", payload);
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
};

export const updateTicket = async (id: string, payload: IUpdateTicketPayload) => {
  try {
    return await httpClient.patch<ITicketDetail>(`/ticketing/${id}`, payload);
  } catch (error) {
    console.error("Error updating ticket:", error);
    throw error;
  }
};

/**
 * Additive: the fee is added to what the customer is charged and the cost to
 * what the supplier is owed. Neither replaces the original figure.
 */
export const recordDateChange = async (id: string, payload: IDateChangePayload) => {
  try {
    return await httpClient.patch<ITicketDetail>(`/ticketing/${id}/date-change`, payload);
  } catch (error) {
    console.error("Error recording date change:", error);
    throw error;
  }
};

/** Its own route, because the generic update deliberately cannot set status. */
export const changeTicketStatus = async (id: string, payload: IChangeTicketStatusPayload) => {
  try {
    return await httpClient.patch<ITicketDetail>(`/ticketing/${id}/status`, payload);
  } catch (error) {
    console.error("Error changing ticket status:", error);
    throw error;
  }
};

export const recordTicketPayment = async (
  id: string,
  payload: IRecordTicketPaymentPayload,
) => {
  try {
    return await httpClient.post<ITicketDetail>(`/ticketing/${id}/payments`, payload);
  } catch (error) {
    console.error("Error recording ticket payment:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only — reversing a posted payment moves an account balance. */
export const deleteTicketPayment = async (id: string, paymentId: string) => {
  try {
    return await httpClient.delete<ITicketDetail>(`/ticketing/${id}/payments/${paymentId}`);
  } catch (error) {
    console.error("Error deleting ticket payment:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only. */
export const deleteTicket = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/ticketing/${id}`);
  } catch (error) {
    console.error("Error deleting ticket:", error);
    throw error;
  }
};
