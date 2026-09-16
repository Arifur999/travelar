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
  return await httpClient.get<ITicketsListResponse>(
    `/ticketing${queryString ? `?${queryString}` : ""}`,
  );
};

/** Includes payments and status history; the list endpoint does not. */
export const getTicketById = async (id: string) => {
  return await httpClient.get<ITicketDetail>(`/ticketing/${id}`);
};

export const createTicket = async (payload: ICreateTicketPayload) => {
  return await httpClient.post<ITicket>("/ticketing", payload);
};

export const updateTicket = async (id: string, payload: IUpdateTicketPayload) => {
  return await httpClient.patch<ITicketDetail>(`/ticketing/${id}`, payload);
};

/**
 * Additive: the fee is added to what the customer is charged and the cost to
 * what the supplier is owed. Neither replaces the original figure.
 */
export const recordDateChange = async (id: string, payload: IDateChangePayload) => {
  return await httpClient.patch<ITicketDetail>(`/ticketing/${id}/date-change`, payload);
};

/** Its own route, because the generic update deliberately cannot set status. */
export const changeTicketStatus = async (id: string, payload: IChangeTicketStatusPayload) => {
  return await httpClient.patch<ITicketDetail>(`/ticketing/${id}/status`, payload);
};

export const recordTicketPayment = async (
  id: string,
  payload: IRecordTicketPaymentPayload,
) => {
  return await httpClient.post<ITicketDetail>(`/ticketing/${id}/payments`, payload);
};

/** AGENCY_ADMIN only — reversing a posted payment moves an account balance. */
export const deleteTicketPayment = async (id: string, paymentId: string) => {
  return await httpClient.delete<ITicketDetail>(`/ticketing/${id}/payments/${paymentId}`);
};

/** AGENCY_ADMIN only. */
export const deleteTicket = async (id: string) => {
  return await httpClient.delete<null>(`/ticketing/${id}`);
};
