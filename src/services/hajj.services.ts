"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IAssignRoomPayload,
  type IChangeHajjBookingStatusPayload,
  type ICreateHajjBatchPayload,
  type ICreateHajjBookingPayload,
  type ICreateHajjPackagePayload,
  type ICreateHajjRoomPayload,
  type IHajjBatch,
  type IHajjBatchSummary,
  type IHajjBooking,
  type IHajjBookingDetail,
  type IHajjBookingsListResponse,
  type IHajjPackage,
  type IHajjRoom,
  type IRecordHajjPaymentPayload,
  type IUpdateHajjBatchPayload,
} from "@/types/hajj.types";
import { type DocumentStatus } from "@/types/enums.types";

/* -------------------------------- packages ------------------------------- */

export const getHajjPackages = async (queryString?: string) => {
  return await httpClient.get<IHajjPackage[]>(
    `/hajj/packages${queryString ? `?${queryString}` : ""}`,
  );
};

export const createHajjPackage = async (payload: ICreateHajjPackagePayload) => {
  return await httpClient.post<IHajjPackage>("/hajj/packages", payload);
};

export const updateHajjPackage = async (
  id: string,
  payload: Partial<ICreateHajjPackagePayload>,
) => {
  return await httpClient.patch<IHajjPackage>(`/hajj/packages/${id}`, payload);
};

export const deleteHajjPackage = async (id: string) => {
  return await httpClient.delete<null>(`/hajj/packages/${id}`);
};

/* -------------------------------- batches -------------------------------- */

export const getHajjBatches = async (queryString?: string) => {
  return await httpClient.get<IHajjBatch[]>(
    `/hajj/batches${queryString ? `?${queryString}` : ""}`,
  );
};

/** Seats, revenue, status breakdown and room occupancy for one batch. */
export const getHajjBatchSummary = async (id: string) => {
  return await httpClient.get<IHajjBatchSummary>(`/hajj/batches/${id}/summary`);
};

export const createHajjBatch = async (payload: ICreateHajjBatchPayload) => {
  return await httpClient.post<IHajjBatch>("/hajj/batches", payload);
};

export const updateHajjBatch = async (id: string, payload: IUpdateHajjBatchPayload) => {
  return await httpClient.patch<IHajjBatch>(`/hajj/batches/${id}`, payload);
};

export const deleteHajjBatch = async (id: string) => {
  return await httpClient.delete<null>(`/hajj/batches/${id}`);
};

/* --------------------------------- rooms --------------------------------- */

export const getHajjRooms = async (batchId: string) => {
  return await httpClient.get<IHajjRoom[]>(
    `/hajj/rooms?batchId=${encodeURIComponent(batchId)}`,
  );
};

export const createHajjRoom = async (payload: ICreateHajjRoomPayload) => {
  return await httpClient.post<IHajjRoom>("/hajj/rooms", payload);
};

export const deleteHajjRoom = async (id: string) => {
  return await httpClient.delete<null>(`/hajj/rooms/${id}`);
};

/* -------------------------------- bookings ------------------------------- */

export const getHajjBookings = async (queryString?: string) => {
  return await httpClient.get<IHajjBookingsListResponse>(
    `/hajj/bookings${queryString ? `?${queryString}` : ""}`,
  );
};

export const getHajjBookingById = async (id: string) => {
  return await httpClient.get<IHajjBookingDetail>(`/hajj/bookings/${id}`);
};

export const createHajjBooking = async (payload: ICreateHajjBookingPayload) => {
  return await httpClient.post<IHajjBooking>("/hajj/bookings", payload);
};

export const changeHajjBookingStatus = async (
  id: string,
  payload: IChangeHajjBookingStatusPayload,
) => {
  return await httpClient.patch<IHajjBookingDetail>(`/hajj/bookings/${id}/status`, payload);
};

/** Pass `roomId: null` to clear an assignment and free the bed. */
export const assignHajjRoom = async (id: string, payload: IAssignRoomPayload) => {
  return await httpClient.patch<IHajjBookingDetail>(`/hajj/bookings/${id}/room`, payload);
};

export const setHajjDocumentStatus = async (
  id: string,
  documentId: string,
  documentStatus: DocumentStatus,
) => {
  return await httpClient.patch<IHajjBookingDetail>(
    `/hajj/bookings/${id}/documents/${documentId}`,
    { status: documentStatus },
  );
};

export const recordHajjPayment = async (id: string, payload: IRecordHajjPaymentPayload) => {
  return await httpClient.post<IHajjBookingDetail>(`/hajj/bookings/${id}/payments`, payload);
};

/** AGENCY_ADMIN only. */
export const deleteHajjPayment = async (id: string, paymentId: string) => {
  return await httpClient.delete<IHajjBookingDetail>(
    `/hajj/bookings/${id}/payments/${paymentId}`,
  );
};

/** AGENCY_ADMIN only. */
export const deleteHajjBooking = async (id: string) => {
  return await httpClient.delete<null>(`/hajj/bookings/${id}`);
};
